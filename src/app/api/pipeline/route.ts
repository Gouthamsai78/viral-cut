import { NextRequest, NextResponse } from 'next/server';
import { analyzeVideo } from '@/agents/video-analyzer';
import { generateStrategy } from '@/agents/engagement-strategist';
import { generateRemotionCode } from '@/agents/remotion-codegen';

export const maxDuration = 120; // Allow up to 2 min for the full pipeline

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let videoUrl: string | null = null;
    let videoFile: File | null = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      videoUrl = formData.get('videoUrl') as string;
      videoFile = formData.get('videoFile') as File;
    } else {
      const body = await req.json();
      videoUrl = body.videoUrl;
    }

    if (!videoUrl && !videoFile) {
      return NextResponse.json({ error: 'videoUrl or videoFile is required' }, { status: 400 });
    }

    // ── Step 1: Video Analysis ──
    const analysis = await analyzeVideo(videoUrl, videoFile);

    // ── Step 2: Engagement Strategy ──
    const strategy = await generateStrategy(analysis);

    // ── Step 3: Remotion Code Generation ──
    const remotionOutput = await generateRemotionCode(analysis, strategy);

    return NextResponse.json({
      analysis,
      strategy,
      remotionOutput,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Pipeline failed';
    console.error('[Pipeline Error]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
