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
        const formData = new FormData();

        if (videoFile) formData.append('videoFile', videoFile);
        for (const img of images) formData.append('images', img);
        if (hasPromptText) formData.append('prompt', prompt.trim());

        const endpoint = hasVideo ? '/api/pipeline' : '/api/generate-from-prompt';

        const res = await fetch(endpoint, {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Generation failed');
        }

        const data = await res.json();

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
