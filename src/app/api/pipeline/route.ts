import { NextRequest, NextResponse } from 'next/server';
import { analyzeVideo } from '@/agents/video-analyzer';
import { generateStrategy } from '@/agents/engagement-strategist';
import { generateRemotionCode, generateRemotionFromPrompt } from '@/agents/remotion-codegen';

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const videoFile = formData.get('videoFile') as File;
    const prompt = formData.get('prompt') as string;
    const imageFiles = formData.getAll('images') as File[];
    const images = imageFiles.filter((f): f is File => f instanceof File && f.size > 0);

    const hasVideo = !!videoFile;
    const hasPrompt = prompt?.trim().length > 0;

    if (!hasVideo && !hasPrompt) {
      return NextResponse.json({ error: 'Provide a video or describe what you want.' }, { status: 400 });
    }

    let analysis;
    let strategy;
    let remotionOutput;

    if (hasVideo) {
      // Video-based pipeline
      analysis = await analyzeVideo(null, videoFile);
      strategy = await generateStrategy(analysis);

      // If prompt is also provided, pass images to code generation
      remotionOutput = await generateRemotionCode(analysis, strategy, images);
    } else {
      // Prompt-only pipeline
      remotionOutput = await generateRemotionFromPrompt(prompt, images);
    }

    return NextResponse.json({
      analysis: analysis ?? null,
      strategy: strategy ?? null,
      remotionOutput,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Pipeline failed';
    console.error('[Pipeline Error]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
