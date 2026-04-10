import { NextRequest, NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import { analyzeVideo } from '@/agents/video-analyzer';
import { generateStrategy } from '@/agents/engagement-strategist';
import { generateRemotionCode, generateRemotionFromPrompt } from '@/agents/remotion-codegen';
import { pipelineRateLimiter, getClientIp } from '@/lib/rate-limiter';

export const maxDuration = 120;

// Helper to create SSE event
function sseEvent(data: any, event?: string) {
  return `event: ${event || 'message'}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(req: NextRequest) {
  // Rate limiting check
  const clientIp = getClientIp(req.headers);
  const rateLimit = pipelineRateLimiter.check(clientIp);

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

  // Parse form data first
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
  }

  const videoUrlRaw = formData.get('videoUrl');
  const videoUrl = typeof videoUrlRaw === 'string' ? videoUrlRaw : null;
  
  const imageUrlRaw = formData.get('imageUrl');
  const imageUrl = typeof imageUrlRaw === 'string' ? imageUrlRaw : null;
  
  const promptRaw = formData.get('prompt');
  const prompt = typeof promptRaw === 'string' ? promptRaw : null;

  // Collect image URLs
  const imageUrls: string[] = [];
  if (imageUrl) {
    imageUrls.push(imageUrl);
  }
  const imageUrlArray = formData.getAll('imageUrls') as string[];
  const MAX_IMAGES = 10;
  for (const url of imageUrlArray) {
    if (url && url.startsWith('https://') && imageUrls.length < MAX_IMAGES) {
      imageUrls.push(url);
    }
  }

  const hasVideo = !!videoUrl;
  const hasImages = imageUrls.length > 0;
  const hasPrompt = prompt !== null && prompt.trim().length > 0;

  if (!hasVideo && !hasPrompt && !hasImages) {
    return NextResponse.json({ error: 'Provide a video, images, or describe what you want.' }, { status: 400 });
  }

  // Create streaming response
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: any, event?: string) => {
        try {
          controller.enqueue(encoder.encode(sseEvent(data, event)));
        } catch (e) {
          console.error('[SSE Send Error]', e);
        }
      };

      const safeSend = async (fn: () => Promise<void>) => {
        try {
          await fn();
        } catch (error: unknown) {
          console.error('[Pipeline Error]', error);

          let message = 'An error occurred while processing your request';
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
              'Invalid TSX output received',
              'Prompt is required',
              'Prompt exceeds maximum length',
            ];

            const isSafeMessage = safeMessages.some(safe => error.message.includes(safe));
            if (isSafeMessage) {
              message = error.message;
            }
          }

          sendEvent({
            step: 'error',
            message,
            error: message,
          }, 'error');
        }
      };

      await safeSend(async () => {
        // Step 1: Video Analysis
        if (hasVideo) {
          sendEvent({
            step: 'analyzing',
            stepIndex: 0,
            progress: 10,
            agent: 'Video Analyzer',
            model: 'gemini-3.1-flash-lite',
            message: 'Starting video analysis...',
            details: 'Initializing AI video processor',
          });

          sendEvent({
            step: 'analyzing',
            stepIndex: 0,
            progress: 15,
            agent: 'Video Analyzer',
            model: 'gemini-3.1-flash-lite',
            message: 'Extracting video frames',
            details: 'Breaking down video into scenes',
          });

          const analysis = await analyzeVideo(videoUrl);

          sendEvent({
            step: 'analyzing',
            stepIndex: 0,
            progress: 25,
            agent: 'Video Analyzer',
            model: 'gemini-3.1-flash-lite',
            message: `Found ${analysis.scenes.length} scenes`,
            details: `Pacing score: ${analysis.pacing.pacingScore}/10, Hook strength: ${analysis.engagementProfile.hookStrength}/10`,
          });

          // Step 2: Engagement Strategy
          sendEvent({
            step: 'strategizing',
            stepIndex: 1,
            progress: 35,
            agent: 'Engagement Strategist',
            model: 'gemini-3-flash-preview',
            message: 'Analyzing engagement patterns',
            details: 'Identifying retention dropoff points',
          });

          const strategy = await generateStrategy(analysis);

          sendEvent({
            step: 'strategizing',
            stepIndex: 1,
            progress: 45,
            agent: 'Engagement Strategist',
            model: 'gemini-3-flash-preview',
            message: `Hook strategy: ${strategy.hookStrategy.type}`,
            details: `${strategy.motionGraphicPlacements.length} motion graphics planned, ${strategy.retentionFixes.length} retention fixes identified`,
          });

          // Step 3: Code Generation
          sendEvent({
            step: 'generating',
            stepIndex: 2,
            progress: 55,
            agent: 'Remotion Code Generator',
            model: 'gemini-3-flash-preview',
            message: 'Generating motion graphics code',
            details: 'Building Remotion TSX components',
          });

          sendEvent({
            step: 'generating',
            stepIndex: 2,
            progress: 65,
            agent: 'Remotion Code Generator',
            model: 'gemini-3-flash-preview',
            message: 'Creating scene sequences',
            details: 'Mapping timeline with sequences and animations',
          });

          const remotionOutput = await generateRemotionCode(analysis, strategy, imageUrls);

          sendEvent({
            step: 'generating',
            stepIndex: 2,
            progress: 85,
            agent: 'Remotion Code Generator',
            model: 'gemini-3-flash-preview',
            message: 'Validating generated code',
            details: 'Checking component structure and exports',
          });

          // Step 4: Complete
          sendEvent({
            step: 'complete',
            stepIndex: 3,
            progress: 100,
            message: 'Generation complete!',
            details: 'Your masterpiece is ready',
          });

          // Send final data
          sendEvent({
            analysis,
            strategy,
            remotionOutput,
          }, 'complete');

        } else {
          // Prompt-only pipeline
          sendEvent({
            step: 'generating',
            stepIndex: 0,
            progress: 10,
            agent: 'Remotion Code Generator',
            model: 'gemini-3-flash-preview',
            message: 'Generating from prompt',
            details: 'Creating motion graphics based on your description',
          });

          sendEvent({
            step: 'generating',
            stepIndex: 0,
            progress: 30,
            agent: 'Remotion Code Generator',
            model: 'gemini-3-flash-preview',
            message: 'Designing component structure',
            details: 'Building scene hierarchy and layout',
          });

          sendEvent({
            step: 'generating',
            stepIndex: 0,
            progress: 60,
            agent: 'Remotion Code Generator',
            model: 'gemini-3-flash-preview',
            message: 'Writing animation code',
            details: 'Creating interpolate() functions and timing',
          });

          const remotionOutput = await generateRemotionFromPrompt(prompt || '', imageUrls);

          sendEvent({
            step: 'generating',
            stepIndex: 0,
            progress: 85,
            agent: 'Remotion Code Generator',
            model: 'gemini-3-flash-preview',
            message: 'Validating generated code',
            details: 'Checking component structure and exports',
          });

          sendEvent({
            step: 'complete',
            stepIndex: 1,
            progress: 100,
            message: 'Generation complete!',
            details: 'Your masterpiece is ready',
          });

          sendEvent({
            analysis: null,
            strategy: null,
            remotionOutput,
          }, 'complete');
        }
      });

      // Clean up uploaded files (always run, even on error)
      try {
        const urlsToCleanup = [videoUrl, ...imageUrls].filter(Boolean);
        for (const url of urlsToCleanup) {
          try {
            await del(url as string);
            console.log('[Cleanup] Deleted file:', url);
          } catch (delError) {
            console.error('[Cleanup] Failed to delete file:', url, delError);
          }
        }
      } catch (cleanupError) {
        console.error('[Cleanup Error]', cleanupError);
      }

      // Close the stream
      try {
        controller.close();
      } catch (closeError) {
        console.error('[Stream Close Error]', closeError);
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}
