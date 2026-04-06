import { generateText, Output } from 'ai';
import { VideoAnalysisSchema, type VideoAnalysis } from './schemas';
import { AI_MODELS } from '@/lib/ai-config';

const SYSTEM_PROMPT = `You are an expert video analyst for social media optimization.
Analyze the provided video with surgical precision. Extract:
1. Scene-by-scene breakdown with visual elements, motion, colors
2. Pacing metrics and shot length analysis
3. Engagement profile: hook strength (1-10), retention dropoff points
4. Audio profile: speech, music, silent segments
5. Unoptimized gaps where engagement can be improved
Be specific with timestamps. Score pacing and hook strength 1-10.`;

export async function analyzeVideo(videoUrl: string | null, videoFile?: File | null): Promise<VideoAnalysis> {
  // Build user content - send video directly to Gemini
  let userContent: string | Array<{ type: 'file'; data: Buffer; mediaType: string } | { type: 'text'; text: string }>;

  if (videoFile) {
    const buffer = Buffer.from(await videoFile.arrayBuffer());
    userContent = [
      {
        type: 'file' as const,
        data: buffer,
        mediaType: videoFile.type || 'video/mp4',
      },
      {
        type: 'text' as const,
        text: 'Analyze the uploaded video for maximum social media engagement optimization.',
      },
    ];
  } else {
    userContent = videoUrl
      ? `Analyze this video for maximum social media engagement optimization: ${videoUrl}`
      : 'Analyze the uploaded video for maximum social media engagement optimization.';
  }

  const { output } = await generateText({
    model: AI_MODELS.videoAnalysis,
    output: Output.object({ schema: VideoAnalysisSchema }),
    system: SYSTEM_PROMPT,
    messages: [
      { role: 'user', content: userContent },
    ],
  });

  return output;
}


