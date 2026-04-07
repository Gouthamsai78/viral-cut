import { NextRequest, NextResponse } from 'next/server';
import { generateRemotionFromPrompt } from '@/agents/remotion-codegen';

export const maxDuration = 120; // Allow up to 2 min for generation

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const prompt = formData.get('prompt') as string;
    const imageFiles = formData.getAll('images') as File[];

    if (!prompt?.trim()) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Filter out non-file entries (FormData can return strings)
    const images = imageFiles.filter((f): f is File => f instanceof File && f.size > 0);

    // Generate Remotion code from prompt + optional images
    const remotionOutput = await generateRemotionFromPrompt(prompt, images);

    return NextResponse.json({
      analysis: null,    // No analysis in prompt mode
      strategy: null,    // No strategy in prompt mode
      remotionOutput,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Generation failed';
    console.error('[Generate from Prompt Error]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
