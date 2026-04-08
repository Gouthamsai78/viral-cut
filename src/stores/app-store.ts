import { create } from 'zustand';
import type { VideoAnalysis, EngagementStrategy, RemotionOutput } from '@/agents/schemas';

type PipelineStatus = 'idle' | 'uploading' | 'analyzing' | 'strategizing' | 'generating' | 'complete' | 'error';

interface PipelineStep {
  name: string;
  status: 'pending' | 'running' | 'complete' | 'error';
  description: string;
}

interface AppStore {
  // Unified inputs
  videoFile: File | null;
  images: File[];
  prompt: string;

  // Pipeline state
  status: PipelineStatus;
  error: string | null;
  steps: PipelineStep[];

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
  { name: 'Analyzing', status: 'pending', description: 'AI processes your input and generates motion graphics' },
  { name: 'Generating', status: 'pending', description: 'Building Remotion TSX components' },
];

export const useAppStore = create<AppStore>((set, get) => ({
  videoFile: null,
  images: [],
  prompt: '',
  status: 'idle',
  error: null,
  steps: [...STEPS],
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
    analysis: null,
    strategy: null,
    remotionOutput: null,
  }),

  runPipeline: async () => {
    const { videoFile, images, prompt } = get();

    const hasVideo = !!videoFile;
    const hasPromptText = prompt.trim().length > 0;

    if (!hasVideo && !hasPromptText) {
      set({ error: 'Upload a video or describe what you want to create.' });
      return;
    }

    set({
      status: 'analyzing',
      error: null,
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
        let videoUrl: string | null = null;

        // If video file exists, upload directly to Vercel Blob from browser
        if (videoFile) {
          set({ status: 'uploading' });

          // Step 1: Get upload token
          const pathname = `videos/${videoFile.name}`;
          const tokenRes = await fetch('/api/upload-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pathname, multipart: true }),
          });

          if (!tokenRes.ok) {
            const errorData = await tokenRes.json();
            throw new Error(errorData.error || 'Failed to get upload token');
          }

          const { token } = await tokenRes.json();

          // Step 2: Upload directly to Vercel Blob from browser
          const uploadRes = await fetch(`https://blob.vercel-storage.com?filename=${encodeURIComponent(videoFile.name)}`, {
            method: 'PUT',
            headers: {
              'Content-Type': videoFile.type || 'video/mp4',
              'Authorization': `Bearer ${token}`,
            },
            body: videoFile,
          });

          if (!uploadRes.ok) {
            throw new Error('Failed to upload video');
          }

          const uploadData = await uploadRes.json();
          videoUrl = uploadData.url;
        }

        // Step 3: Process with pipeline
        set({ status: 'analyzing' });

        const formData = new FormData();
        if (videoUrl) formData.append('videoUrl', videoUrl);
        for (const img of images) formData.append('images', img);
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
            // If response is not JSON, get text
            const text = await res.text();
            errorMessage = text || errorMessage;
          }
          throw new Error(errorMessage);
        }

        let data;
        try {
          data = await res.json();
        } catch {
          const text = await res.text();
          throw new Error(`Invalid server response: ${text.substring(0, 100)}`);
        }

        set({
          status: 'complete',
          analysis: data.analysis ?? null,
          strategy: data.strategy ?? null,
          remotionOutput: data.remotionOutput,
          steps: STEPS.map(s => ({ ...s, status: 'complete' as const })),
        });
      } catch (err: unknown) {
        if (attempt < maxRetries) {
          attempt++;
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
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
