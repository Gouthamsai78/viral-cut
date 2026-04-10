import { generateText, Output } from 'ai';
import { VideoAnalysisSchema, type VideoAnalysis } from './schemas';
import { AI_MODELS } from '@/lib/ai-config';
import { validateAndSanitizeUrl, validateFile, validateMagicBytes, MAX_FILE_SIZE } from '@/lib/security';

const SYSTEM_PROMPT = `You are an expert video analyst for social media optimization.
Analyze the provided video with surgical precision. Extract:
1. Scene-by-scene breakdown with visual elements, motion, colors
2. Pacing metrics and shot length analysis
3. Engagement profile: hook strength (1-10), retention dropoff points
4. Audio profile: speech, music, silent segments
5. Unoptimized gaps where engagement can be improved
Be specific with timestamps. Score pacing and hook strength 1-10.`;

const FETCH_TIMEOUT_MS = 30000; // 30 seconds
const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB for video (higher than general limit)

export async function analyzeVideo(videoUrl: string | null, videoFile?: File | null): Promise<VideoAnalysis> {
  // Build user content - send video directly to Gemini
  let userContent: string | Array<{ type: 'file'; data: Buffer; mediaType: string } | { type: 'text'; text: string }>;

  if (videoFile) {
    // Validate file size and type
    validateFile(videoFile, ['video/'], MAX_VIDEO_SIZE);
    
    const buffer = Buffer.from(await videoFile.arrayBuffer());
    
    // Validate magic bytes for video files
    if (!validateMagicBytes(buffer, videoFile.type || 'video/mp4')) {
      throw new Error('File content does not match claimed video type');
    }
    
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
  } else if (videoUrl) {
    // CRITICAL: Validate URL to prevent SSRF attacks
    const safeUrl = validateAndSanitizeUrl(videoUrl);
    
    // Fetch video from URL with timeout and error handling
    let response: Response;
    try {
      response = await fetch(safeUrl, { 
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'TimeoutError') {
        throw new Error(`Failed to fetch video: request timed out after ${FETCH_TIMEOUT_MS / 1000}s`);
      }
      if (error instanceof Error && error.name === 'TypeError') {
        throw new Error(`Failed to fetch video: invalid URL or network error`);
      }
      throw new Error(`Failed to fetch video: ${error instanceof Error ? error.message : 'unknown error'}`);
    }
    
    if (!response.ok) {
      throw new Error(`Failed to fetch video from URL: ${response.status} ${response.statusText}`);
    }
    
    // Check content length to prevent OOM
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_VIDEO_SIZE) {
      throw new Error(`Video file is too large (max ${(MAX_VIDEO_SIZE / (1024 * 1024)).toFixed(0)}MB)`);
    }
    
    const buffer = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get('content-type') || 'video/mp4';

    // Validate magic bytes
    if (!validateMagicBytes(buffer, contentType)) {
      throw new Error('Remote file content does not match claimed video type');
    }

    userContent = [
      {
        type: 'file' as const,
        data: buffer,
        mediaType: contentType,
      },
      {
        type: 'text' as const,
        text: 'Analyze this video for maximum social media engagement optimization.',
      },
    ];
  } else {
    userContent = 'Analyze the uploaded video for maximum social media engagement optimization.';
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


