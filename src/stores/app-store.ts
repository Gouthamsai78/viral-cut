import { create } from 'zustand';
import type { VideoAnalysis, EngagementStrategy, RemotionOutput } from '@/agents/schemas';

type PipelineStatus = 'idle' | 'uploading' | 'analyzing' | 'strategizing' | 'generating' | 'complete' | 'error';

interface PipelineStep {
  name: string;
  status: 'pending' | 'running' | 'complete' | 'error';
  description: string;
}

interface AppStore {
  // Video input
  videoUrl: string;
  videoFile: File | null;

  // Pipeline state
  status: PipelineStatus;
  error: string | null;
  steps: PipelineStep[];

  // Results
  analysis: VideoAnalysis | null;
  strategy: EngagementStrategy | null;
  remotionOutput: RemotionOutput | null;

  // Actions
  setVideoUrl: (url: string) => void;
  setVideoFile: (file: File | null) => void;
  runPipeline: (videoUrl?: string) => Promise<void>;
  reset: () => void;
}

const INITIAL_STEPS: PipelineStep[] = [
  { name: 'Video Analyzer', status: 'pending', description: 'AI breaks down scenes, pacing, and engagement' },
  { name: 'Engagement Strategist', status: 'pending', description: 'Generates retention fixes and hook strategies' },
  { name: 'Motion Graphics Generator', status: 'pending', description: 'Creates Remotion TSX overlay components' },
];

export const useAppStore = create<AppStore>((set, get) => ({
  videoUrl: '',
  videoFile: null,
  status: 'idle',
  error: null,
  steps: [...INITIAL_STEPS],
  analysis: null,
  strategy: null,
  remotionOutput: null,

  setVideoUrl: (url) => set({ videoUrl: url }),
  setVideoFile: (file) => set({ videoFile: file }),

  reset: () => set({
    videoUrl: '',
    videoFile: null,
    status: 'idle',
    error: null,
    steps: [...INITIAL_STEPS],
    analysis: null,
    strategy: null,
    remotionOutput: null,
  }),

  runPipeline: async (videoUrl?: string) => {
    const { videoFile, videoUrl: storeUrl } = get();
    const targetUrl = videoUrl || storeUrl;

    if (!targetUrl && !videoFile) {
      set({ error: 'No video source provided' });
      return;
    }

    set({
      status: videoFile ? 'uploading' : 'analyzing',
      error: null,
      steps: INITIAL_STEPS.map((s, i) => ({
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
        if (videoFile) {
          formData.append('videoFile', videoFile);
        } else if (targetUrl) {
          formData.append('videoUrl', targetUrl);
        }

        const res = await fetch('/api/pipeline', {
          method: 'POST',
          body: formData, // Send as FormData to support files
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Pipeline failed');
        }

        const data = await res.json();

        set({
          status: 'complete',
          analysis: data.analysis,
          strategy: data.strategy,
          remotionOutput: data.remotionOutput,
          steps: INITIAL_STEPS.map(s => ({ ...s, status: 'complete' as const })),
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
