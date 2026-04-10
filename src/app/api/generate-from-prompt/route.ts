import { NextRequest, NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import { generateRemotionFromPrompt } from '@/agents/remotion-codegen';
import { codeGenRateLimiter, getClientIp } from '@/lib/rate-limiter';

export const maxDuration = 120; // Allow up to 2 min for generation

export async function POST(req: NextRequest) {
  // Rate limiting check
  const clientIp = getClientIp(req.headers);
  const rateLimit = codeGenRateLimiter.check(clientIp);
  
  if (!rateLimit.allowed) {
    const retryAfter = Math.max(1, Math.ceil((rateLimit.resetTime - Date.now()) / 1000));
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again later.', retryAfter },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Reset': String(rateLimit.resetTime),
          'Retry-After': String(retryAfter),
        },
      }
    );
  }

  const imageUrls: string[] = [];

  try {
    const formData = await req.formData();
    const prompt = formData.get('prompt') as string;
    const imageUrl = formData.get('imageUrl') as string;

    // Collect image URLs from Vercel Blob uploads
    if (imageUrl) {
      imageUrls.push(imageUrl);
    }
    const imageUrlArray = formData.getAll('imageUrls') as string[];
    for (const url of imageUrlArray) {
      if (url && url.startsWith('https://')) {
        imageUrls.push(url);
      }
    }

    if (!prompt?.trim()) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Generate Remotion code from prompt + optional image URLs
    const remotionOutput = await generateRemotionFromPrompt(prompt, imageUrls);

    return NextResponse.json({
      analysis: null,    // No analysis in prompt mode
      strategy: null,    // No strategy in prompt mode
      remotionOutput,
    });
  } catch (error: unknown) {
    console.error('[Generate from Prompt Error]', error);
    
    // Sanitize error messages to prevent information leakage
    let message = 'An error occurred while generating your video';
    if (error instanceof Error) {
      const safeMessages = [
        'Invalid URL format',
        'Only HTTP and HTTPS protocols are allowed',
        'File size exceeds maximum allowed size',
        'File type',
        'is not allowed',
        'Prompt exceeds maximum length',
        'Invalid TSX output received',
        'Prompt is required',
        'Rate limit exceeded',
      ];
      
      const isSafeMessage = safeMessages.some(safe => error.message.includes(safe));
      if (isSafeMessage) {
        message = error.message;
      }
    }
    
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    // Clean up uploaded images after processing
    for (const url of imageUrls) {
      try {
        await del(url);
        console.log('[Cleanup] Deleted image:', url);
      } catch (delError) {
        console.error('[Cleanup] Failed to delete image:', url, delError);
      }
    }
  }
}
