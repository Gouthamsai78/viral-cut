import { useState, useCallback, useRef } from 'react';
import type { RemotionOutput } from '@/agents/schemas';

interface RenderProgress {
  encodedFrames: number;
  totalFrames: number;
  progress: number;
  estimatedTimeRemaining: number;
}

interface UseClientRenderOptions {
  /** Called when render progresses */
  onProgress?: (progress: RenderProgress) => void;
  /** Called when render completes with the output blob */
  onComplete?: (blob: Blob) => void;
  /** Called when render fails */
  onError?: (error: Error) => void;
}

interface ClientRenderResult {
  /** Whether a render is currently in progress */
  isRendering: boolean;
  /** Current progress (0-1) */
  progress: number;
  /** Progress details */
  renderProgress: RenderProgress | null;
  /** Error message if render failed */
  error: string | null;
  /** Whether the browser supports client-side rendering */
  isSupported: boolean;
  /** Abort the current render */
  abort: () => void;
  /** Start rendering a RemotionOutput to MP4 blob */
  render: (output: RemotionOutput, Component: React.ComponentType) => Promise<void>;
}

/**
 * Client-side video rendering hook using @remotion/web-renderer.
 *
 * Renders Remotion components directly in the browser using WebCodecs API —
 * no server, no Lambda, no FFmpeg. The output is an MP4 Blob ready for download.
 *
 * Browser support: Chrome 94+, Firefox 130+, Safari 26+.
 * Experimental API — may have bugs and breaking changes.
 */
export function useClientRender(options: UseClientRenderOptions = {}): ClientRenderResult {
  const { onProgress, onComplete, onError } = options;

  const [isRendering, setIsRendering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [renderProgress, setRenderProgress] = useState<RenderProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  const abortRef = useRef<AbortController | null>(null);

  // Check browser support on mount
  useState(() => {
    // WebCodecs API is required for client-side rendering
    if (typeof window !== 'undefined' && !('VideoEncoder' in window)) {
      setIsSupported(false);
    }
  });

  const abort = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
      setIsRendering(false);
      setError('Render cancelled');
    }
  }, []);

  const render = useCallback(async (output: RemotionOutput, Component: React.ComponentType) => {
    if (!isSupported) {
      const err = new Error('Client-side rendering is not supported in your browser. Please use Chrome or Firefox.');
      setError(err.message);
      onError?.(err);
      return;
    }

    if (isRendering) {
      return; // Already rendering
    }

    setIsRendering(true);
    setProgress(0);
    setRenderProgress(null);
    setError(null);

    const abortController = new AbortController();
    abortRef.current = abortController;

    const { compositionConfig } = output;
    const durationInFrames = Math.ceil(compositionConfig.durationInSeconds * compositionConfig.fps);

    try {
      // Dynamic import to avoid SSR issues
      const { renderMediaOnWeb } = await import('@remotion/web-renderer');

      const result = await renderMediaOnWeb({
        composition: {
          id: compositionConfig.id,
          component: Component,
          durationInFrames,
          fps: compositionConfig.fps,
          width: compositionConfig.width,
          height: compositionConfig.height,
        },
        container: 'mp4',
        videoCodec: 'h264',
        onProgress: ({ encodedFrames, progress: p, renderEstimatedTime }) => {
          const prog = {
            encodedFrames,
            totalFrames: durationInFrames,
            progress: p,
            estimatedTimeRemaining: renderEstimatedTime,
          };
          setRenderProgress(prog);
          setProgress(p);
          onProgress?.(prog);
        },
        signal: abortController.signal,
        logLevel: 'warn',
      });

      const blob = await result.getBlob();

      if (!abortController.signal.aborted) {
        setIsRendering(false);
        setProgress(1);
        setRenderProgress({
          encodedFrames: durationInFrames,
          totalFrames: durationInFrames,
          progress: 1,
          estimatedTimeRemaining: 0,
        });
        onComplete?.(blob);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        // Render was cancelled — already handled
        return;
      }

      const message = err instanceof Error ? err.message : 'Unknown render error';
      setError(message);
      setIsRendering(false);
      setRenderProgress(null);

      const renderError = new Error(message);
      onError?.(renderError);
    } finally {
      abortRef.current = null;
    }
  }, [isSupported, isRendering, onProgress, onComplete, onError]);

  return {
    isRendering,
    progress,
    renderProgress,
    error,
    isSupported,
    abort,
    render,
  };
}
