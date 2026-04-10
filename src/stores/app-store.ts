import { create } from 'zustand';
import type { VideoAnalysis, EngagementStrategy, RemotionOutput } from '@/agents/schemas';

type PipelineState = 'idle' | 'uploading' | 'analyzing' | 'strategizing' | 'generating' | 'complete' | 'error';

interface PipelineStep {
  name: string;
  status: 'pending' | 'running' | 'complete' | 'error';
  description: string;
}

interface RealTimeStatus {
  step: string;
  stepIndex: number;
  progress: number;
  agent?: string;
  model?: string;
  message: string;
  details: string;
}

interface AppStore {
  // Unified inputs
  videoFile: File | null;
  images: File[];
  prompt: string;

  // Pipeline state
  status: PipelineState;
  error: string | null;
  steps: PipelineStep[];
  currentStatus: RealTimeStatus | null; // Real-time status from server

  // Results
  analysis: VideoAnalysis | null;
  strategy: EngagementStrategy | null;
  remotionOutput: RemotionOutput | null;

  // Actions
  setVideoFile: (file: File | null) => void;
  setImages: (images: File[]) => void;
  setPrompt: (prompt: string) => void;
  runPipeline: () => Promise<void>;
  reset: () => void;
}

const STEPS: PipelineStep[] = [
  { name: 'Video Analysis', status: 'pending', description: 'AI breaks down scenes, pacing, engagement metrics, and audio profile' },
  { name: 'Engagement Strategy', status: 'pending', description: 'Generates retention fixes, hook strategies, and motion graphic placements' },
  { name: 'Code Generation', status: 'pending', description: 'Building Remotion TSX components with motion graphics' },
];

export const useAppStore = create<AppStore>((set, get) => ({
  videoFile: null,
  images: [],
  prompt: '',
  status: 'idle',
  error: null,
  steps: [...STEPS],
  currentStatus: null,
  analysis: null,
  strategy: null,
  remotionOutput: null,

  setVideoFile: (file) => set({ videoFile: file }),
  setImages: (images) => set({ images }),
  setPrompt: (prompt) => set({ prompt }),
  resetPipeline: () => set({
    status: 'idle',
    error: null,
    steps: [...STEPS],
    currentStatus: null,
    analysis: null,
    strategy: null,
    remotionOutput: null,
  }),

  reset: () => set({
    videoFile: null,
    images: [],
    prompt: '',
    status: 'idle',
    error: null,
    steps: [...STEPS],
    currentStatus: null,
    analysis: null,
    strategy: null,
    remotionOutput: null,
  }),

  runPipeline: async () => {
    const { videoFile, images, prompt, status: currentStatus } = get();

    // Guard against concurrent pipeline runs
    if (currentStatus !== 'idle' && currentStatus !== 'complete' && currentStatus !== 'error') {
      console.warn('[Pipeline] Already running, ignoring duplicate call');
      return;
    }

    const hasVideo = !!videoFile;
    const hasPromptText = prompt.trim().length > 0;

    if (!hasVideo && !hasPromptText) {
      set({ error: 'Upload a video or describe what you want to create.' });
      return;
    }

    // Create a unique run ID to detect resets
    const runId = Date.now().toString();
    set({
      status: 'analyzing',
      error: null,
      currentStatus: null,
      steps: STEPS.map((s, i) => ({
        ...s,
        status: i === 0 ? 'running' : 'pending',
      })),
      analysis: null,
      strategy: null,
      remotionOutput: null,
    });

    const maxRetries = 2;
    let attempt = 0;

    const performFetch = async () => {
      try {
        // Check if pipeline was reset during retry delay
        if (get().status === 'idle') {
          console.log('[Pipeline] Reset detected, aborting retry');
          return;
        }
        let videoUrl: string | null = null;
        const uploadedImageUrls: string[] = [];

        // If video file exists, upload directly to Vercel Blob from browser
        if (videoFile) {
          set({ status: 'uploading' });

          // Upload directly to Vercel Blob using the client SDK
          const { upload } = await import('@vercel/blob/client');

          // NOTE: Currently using 'public' access for MVP functionality.
          // TODO: Switch to 'private' access and implement signed URL generation
          // for better privacy. This would require:
          // 1. Upload with access: 'private'
          // 2. Server endpoint to generate signed download URL
          // 3. Fetch signed URL before calling /api/pipeline
          // 4. Update /api/pipeline to accept signed URLs
          const result = await upload(`videos/${videoFile.name}`, videoFile, {
            access: 'public', // FIXME: Change to 'private' when signed URLs are implemented
            handleUploadUrl: '/api/upload-token',
            contentType: videoFile.type || 'video/mp4',
            multipart: true,
            onUploadProgress: (progress) => {
              console.log(`Upload progress: ${Math.round(progress.percentage)}%`);
            },
          });

          videoUrl = result.url;
        }

        // Upload images to Vercel Blob (if any)
        if (images.length > 0) {
          set({ status: 'uploading' });
          const { upload } = await import('@vercel/blob/client');

          for (let i = 0; i < images.length; i++) {
            const img = images[i];
            try {
              const result = await upload(`images/${Date.now()}-${img.name}`, img, {
                access: 'public',
                handleUploadUrl: '/api/upload-token',
                contentType: img.type || 'image/png',
                multipart: true,
                onUploadProgress: (progress) => {
                  console.log(`Image ${i + 1}/${images.length} upload progress: ${Math.round(progress.percentage)}%`);
                },
              });
              uploadedImageUrls.push(result.url);
            } catch (uploadError) {
              console.error(`Failed to upload image ${i + 1}:`, uploadError);
              // Continue with other images even if one fails
            }
          }

          console.log(`Successfully uploaded ${uploadedImageUrls.length}/${images.length} images`);
        }

        // Step 3: Process with pipeline
        set({ status: 'analyzing' });

        const formData = new FormData();
        if (videoUrl) formData.append('videoUrl', videoUrl);
        
        // Add uploaded image URLs to FormData
        if (uploadedImageUrls.length > 0) {
          // Send first image URL for backward compatibility
          formData.append('imageUrl', uploadedImageUrls[0]);
          // Send all image URLs for the new API
          for (const url of uploadedImageUrls) {
            formData.append('imageUrls', url);
          }
        }
        
        if (hasPromptText) formData.append('prompt', prompt.trim());

        const endpoint = hasVideo ? '/api/pipeline' : '/api/generate-from-prompt';

        const res = await fetch(endpoint, {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          let errorMessage = 'Generation failed';
          try {
            const data = await res.json();
            errorMessage = data.error || errorMessage;
          } catch {
            try {
              const text = await res.text();
              errorMessage = text || errorMessage;
            } catch {
              // Body already consumed or unreadable
              errorMessage = 'Generation failed';
            }
          }
          throw new Error(errorMessage);
        }

        // Check if response is streaming (SSE)
        const contentType = res.headers.get('content-type');
        if (contentType?.includes('text/event-stream')) {
          // Consume Server-Sent Events
          const reader = res.body?.getReader();
          if (!reader) {
            throw new Error('Streaming not supported in this environment');
          }

          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep incomplete line in buffer

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));

                  // Check if it's an error event
                  if (data.step === 'error' || data.error) {
                    throw new Error(data.error || data.message || 'Pipeline failed');
                  }

                  // Check if it's a status update or complete data
                  if (data.step && !data.analysis && !data.remotionOutput) {
                    // Status update
                    set({ currentStatus: data });

                    // Update main status based on step
                    if (data.step === 'analyzing') {
                      set({ status: 'analyzing' });
                    } else if (data.step === 'strategizing') {
                      set({ status: 'strategizing' });
                    } else if (data.step === 'generating') {
                      set({ status: 'generating' });
                    } else if (data.step === 'complete') {
                      set({ status: 'complete' });
                    }

                    // Update step indicators
                    set({
                      steps: STEPS.map((s, i) => ({
                        ...s,
                        status: i < data.stepIndex ? 'complete' : i === data.stepIndex ? 'running' : 'pending',
                      })),
                    });
                  } else if (data.analysis !== undefined || data.remotionOutput) {
                    // Complete data
                    set({
                      status: 'complete',
                      analysis: data.analysis ?? null,
                      strategy: data.strategy ?? null,
                      remotionOutput: data.remotionOutput,
                      steps: STEPS.map(s => ({ ...s, status: 'complete' as const })),
                    });
                  }
                } catch (e) {
                  // Re-throw to be caught by outer try-catch
                  throw e;
                }
              }
            }
          }
        } else {
          // Fallback to regular JSON response
          let data;
          try {
            data = await res.json();
          } catch {
            try {
              const text = await res.text();
              throw new Error(`Invalid server response: ${text.substring(0, 100)}`);
            } catch (textError) {
              // Body already consumed or unreadable
              throw new Error('Invalid server response');
            }
          }

          set({
            status: 'complete',
            analysis: data.analysis ?? null,
            strategy: data.strategy ?? null,
            remotionOutput: data.remotionOutput,
            steps: STEPS.map(s => ({ ...s, status: 'complete' as const })),
          });
        }
      } catch (err: unknown) {
        if (attempt < maxRetries) {
          attempt++;
          // Add exponential backoff with jitter to prevent thundering herd
          const baseDelay = 2000 * attempt;
          const jitter = Math.random() * 1000;
          const delay = baseDelay + jitter;
          await new Promise(resolve => setTimeout(resolve, delay));
          return performFetch();
        }

        const message = err instanceof Error ? err.message : 'Unknown error';
        set({
          status: 'error',
          error: message,
          steps: get().steps.map(s =>
            s.status === 'running' ? { ...s, status: 'error' as const } : s
          ),
        });
      }
    };

    await performFetch();
  },
}));
