import { NextRequest, NextResponse } from 'next/server';
import { analyzeVideo } from '@/agents/video-analyzer';
import { analysisRateLimiter, getClientIp } from '@/lib/rate-limiter';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  // Rate limiting check
  const clientIp = getClientIp(req.headers);
  const rateLimit = analysisRateLimiter.check(clientIp);
  
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

  try {
    const { videoUrl } = await req.json();

    if (!videoUrl) {
      return NextResponse.json({ error: 'videoUrl is required' }, { status: 400 });
    }

    const analysis = await analyzeVideo(videoUrl);
    return NextResponse.json({ analysis });
  } catch (error: unknown) {
    console.error('[Analyze Error]', error);
    
    // Sanitize error messages to prevent information leakage
    let message = 'An error occurred while analyzing your video';
    if (error instanceof Error) {
      const safeMessages = [
        'Invalid URL format',
        'Only HTTP and HTTPS protocols are allowed',
        'URL points to a restricted address',
        'URL points to a private IP address',
        'File size exceeds maximum allowed size',
        'File type',
        'is not allowed',
        'Failed to fetch video',
        'request timed out',
        'Video file is too large',
        'File content does not match',
        'Remote file content does not match',
        'videoUrl is required',
        'Rate limit exceeded',
      ];
      
      const isSafeMessage = safeMessages.some(safe => 
        error.message.includes(safe)
      );
      
      if (isSafeMessage) {
        message = error.message;
      }
    }
    
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
