import { NextRequest, NextResponse } from 'next/server';
import { analyzeVideo } from '@/agents/video-analyzer';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { videoUrl } = await req.json();

    if (!videoUrl) {
      return NextResponse.json({ error: 'videoUrl is required' }, { status: 400 });
    }

    const analysis = await analyzeVideo(videoUrl);
    return NextResponse.json({ analysis });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Analysis failed';
    console.error('[Analyze Error]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
