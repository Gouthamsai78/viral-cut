'use client';

import type { RemotionOutput } from '@/agents/schemas';

import React, { useState, useRef, useCallback } from 'react';
import { useAppStore } from '@/stores/app-store';
import { Zap, Sparkles, Film, Loader2, CheckCircle2, XCircle, Clock, Code2, BarChart3, Eye, Download, Play, Upload, MousePointer2, AlertTriangle, Wand2, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Player } from '@remotion/player';
import { useCompilation } from '@/hooks/use-compilation';
import { useClientRender } from '@/hooks/use-client-render';
import { ChatEditor } from '@/components/chat-editor';
import { PropertyEditor } from '@/components/property-editor';

// ── Remotion Player Component (NPM Package + Babel Transpilation) ──
function RemotionPlayerBridge({ output }: { output: RemotionOutput }) {
  const { Component, error } = useCompilation(output.tsxCode);

  if (error) {
    return (
      <div className="w-full aspect-video flex flex-col items-center justify-center bg-accent-red/10 rounded-2xl border border-accent-red/20 p-8 text-center">
        <XCircle className="w-12 h-12 text-accent-red mb-4" />
        <h3 className="text-lg font-bold text-accent-red mb-2">Preview Failed</h3>
        <p className="text-sm text-text-muted max-w-md">{error}</p>
      </div>
    );
  }

  if (!Component) {
    return (
      <div className="w-full aspect-video flex flex-col items-center justify-center bg-black/20 rounded-2xl border border-white/5 animate-pulse">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-sm text-text-muted">Preparing live preview...</p>
      </div>
    );
  }

  const { width, height, fps, durationInSeconds } = output.compositionConfig;

  return (
    <div className="w-full aspect-video rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl relative group">
      <Player
        component={Component}
        durationInFrames={Math.ceil(durationInSeconds * fps)}
        compositionWidth={width}
        compositionHeight={height}
        fps={fps}
        controls
        style={{
          width: '100%',
          height: '100%',
        }}
      />
    </div>
  );
}

// ── Unified Input (Video + Images + Prompt) ──
function UnifiedInput() {
  const {
    videoFile, images, prompt,
    setVideoFile, setImages, setPrompt,
    runPipeline, status,
  } = useAppStore();

  const [localPrompt, setLocalPrompt] = useState(prompt);
  const [dragActive, setDragActive] = useState(false);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const videoFileRef = useRef<HTMLInputElement>(null);
  const imageFileRef = useRef<HTMLInputElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);

  const isRunning = status !== 'idle' && status !== 'complete' && status !== 'error';

  // Create video preview URL when file changes
  React.useEffect(() => {
    if (videoFile) {
      const url = URL.createObjectURL(videoFile);
      setVideoPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setVideoPreviewUrl(null);
  }, [videoFile]);

  const handleVideoFile = (file: File) => {
    if (!file.type.startsWith('video/')) {
      alert("Please upload a video file.");
      return;
    }
    setVideoFile(file);
  };

  const handleImageFiles = (files: File[]) => {
    const valid = files.filter(f => f.type.startsWith('image/'));
    if (valid.length) setImages([...images, ...valid]);
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const removeVideo = () => {
    setVideoFile(null);
    setVideoPreviewUrl(null);
  };

  // Handle clipboard paste (images only)
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items);
    const imageItems = items.filter(item => item.type.startsWith('image/'));
    if (imageItems.length > 0) {
      e.preventDefault();
      const files = imageItems
        .map(item => item.getAsFile())
        .filter((f): f is File => f !== null);
      handleImageFiles(files);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files);
    const videos = files.filter(f => f.type.startsWith('video/'));
    const imgs = files.filter(f => f.type.startsWith('image/'));
    if (videos[0]) handleVideoFile(videos[0]);
    if (imgs.length) handleImageFiles(imgs);
  };

  const handleSubmit = () => {
    if (localPrompt.trim()) {
      setPrompt(localPrompt.trim());
    }
    runPipeline();
  };

  const hasInput = !!(videoFile || localPrompt.trim() || images.length > 0);

  return (
    <div
      className="w-full max-w-3xl mx-auto space-y-4"
      onPaste={handlePaste}
    >
      {/* Input Panel */}
      <div className="glass-strong rounded-2xl p-4 space-y-3">
        {/* Prompt */}
        <textarea
          ref={promptRef}
          value={localPrompt}
          onChange={(e) => setLocalPrompt(e.target.value)}
          placeholder="Describe what you want to create... (optional)&#10;&#10;e.g., 'A motivational video with bold neon text, countdown timer, glitch transitions, dark cyberpunk background'"
          className="w-full h-24 bg-transparent text-text-primary placeholder:text-text-muted outline-none resize-none text-sm leading-relaxed"
          disabled={isRunning}
        />

        {/* Video Preview */}
        {videoPreviewUrl && (
          <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black">
            <video
              src={videoPreviewUrl}
              controls
              className="w-full max-h-64 object-contain"
            />
            <button
              onClick={removeVideo}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white text-sm flex items-center justify-center hover:bg-accent-red/80 transition-colors"
              title="Remove video"
            >
              ×
            </button>
          </div>
        )}

        {/* Attached images */}
        {images.length > 0 && (
          <div>
            <p className="text-xs text-text-muted mb-2 uppercase tracking-wider font-semibold">Reference Images ({images.length})</p>
            <div className="flex flex-wrap gap-2">
              {images.map((img, i) => (
                <div key={i} className="relative group">
                  <img
                    src={URL.createObjectURL(img)}
                    alt={img.name}
                    className="w-16 h-16 rounded-lg object-cover border border-white/10"
                  />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-accent-red/80 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove image"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => videoFileRef.current?.click()}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-text-muted hover:text-text-secondary glass border border-white/5 hover:border-white/10 transition-all disabled:opacity-40"
          >
            <Upload className="w-3.5 h-3.5" /> Upload Video
          </button>
          <input
            ref={videoFileRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleVideoFile(e.target.files[0])}
          />

          <button
            type="button"
            onClick={() => imageFileRef.current?.click()}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-text-muted hover:text-text-secondary glass border border-white/5 hover:border-white/10 transition-all disabled:opacity-40"
          >
            <Upload className="w-3.5 h-3.5" /> Add Images
          </button>
          <input
            ref={imageFileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleImageFiles(Array.from(e.target.files || []))}
          />

          <div className="flex-1" />

          <span className="text-[10px] text-text-muted hidden sm:inline">
            💡 Ctrl+V to paste images
          </span>

          <button
            onClick={handleSubmit}
            disabled={isRunning || !hasInput}
            className="gradient-btn rounded-xl px-5 py-2 text-sm font-semibold flex items-center gap-2 disabled:opacity-40"
          >
            {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Generate
          </button>
        </div>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={cn(
          "relative cursor-pointer h-24 glass-strong border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all duration-300",
          dragActive ? "border-primary bg-primary/5 scale-[1.01]" : "border-white/10 hover:border-white/20",
          isRunning && "opacity-50 pointer-events-none"
        )}
      >
        <div className="text-center">
          <p className="text-xs font-medium text-text-muted">
            Drag & drop video or image files here
          </p>
          <p className="text-[10px] text-text-muted mt-0.5">MP4, MOV, WEBM · PNG, JPG, WEBP · Ctrl+V to paste</p>
        </div>
        {dragActive && (
          <div className="absolute inset-0 bg-primary/10 rounded-2xl flex items-center justify-center backdrop-blur-[2px]">
            <MousePointer2 className="w-6 h-6 text-primary animate-bounce" />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Pipeline Progress ──
function PipelineProgress() {
  const { steps, status, error } = useAppStore();

  if (status === 'idle') return null;

  return (
    <div className="w-full max-w-xl mx-auto mt-12 fade-in">
      <div className="glass-strong rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-widest mb-6">
          AI Pipeline
        </h3>
        <div className="space-y-4">
          {steps.map((step, i) => (
            <div key={step.name} className="flex items-start gap-4">
              {/* Status icon */}
              <div className="mt-0.5">
                {step.status === 'complete' && (
                  <CheckCircle2 className="w-5 h-5 text-accent-green" />
                )}
                {step.status === 'running' && (
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                )}
                {step.status === 'error' && (
                  <XCircle className="w-5 h-5 text-accent-red" />
                )}
                {step.status === 'pending' && (
                  <Clock className="w-5 h-5 text-text-muted" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-sm font-medium",
                    step.status === 'complete' && "text-accent-green",
                    step.status === 'running' && "text-primary-dim",
                    step.status === 'error' && "text-accent-red",
                    step.status === 'pending' && "text-text-muted",
                  )}>
                    {step.name}
                  </span>
                  {step.status === 'running' && (
                    <span className="text-xs text-primary-light px-2 py-0.5 rounded-full bg-primary/10">
                      In Progress
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-muted mt-0.5">{step.description}</p>
              </div>

              {/* Step number */}
              <span className="text-xs text-text-muted font-mono">
                {String(i + 1).padStart(2, '0')}
              </span>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        {(
          <div className="mt-6 h-1 bg-surface-high rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-1000 ease-out",
                status === 'error' ? "bg-accent-red" : "bg-gradient-to-r from-primary-light to-secondary",
                status === 'complete' && "w-full",
                status === 'analyzing' && "w-[15%] shimmer",
                status === 'strategizing' && "w-[45%] shimmer",
                status === 'generating' && "w-[75%] shimmer",
              )}
            />
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-accent-red/10 border border-accent-red/20">
            <p className="text-sm text-accent-red">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Results View ──
function ResultsView() {
  const { analysis, strategy, remotionOutput, status, reset } = useAppStore();
  const [activeTab, setActiveTab] = useState<'preview' | 'analysis' | 'strategy' | 'code' | 'custom' | 'editor'>('preview');
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [customCode, setCustomCode] = useState('');
  const [useCustomCode, setUseCustomCode] = useState(false);
  const [showRenderModal, setShowRenderModal] = useState(false);
  const [editorSubTab, setEditorSubTab] = useState<'props' | 'chat'>('props');

  // The code that's currently being previewed/rendered
  const [remotionCode, setRemotionCode] = useState('');

  // Reset local state when pipeline status changes to idle or error
  React.useEffect(() => {
    if (status === 'idle' || status === 'error') {
      setRemotionCode('');
      setCustomCode('');
      setUseCustomCode(false);
      setActiveTab('preview');
      setDownloadError(null);
      setShowRenderModal(false);
    }
  }, [status]);

  // Initialize code from AI output or custom code
  const currentCode = useCustomCode && customCode.trim() ? customCode : remotionCode || remotionOutput?.tsxCode || '';

  // If the AI output changes, update the code
  React.useEffect(() => {
    if (remotionOutput?.tsxCode && !remotionCode) {
      setRemotionCode(remotionOutput.tsxCode);
    }
  }, [remotionOutput, remotionCode]);

  // Compile the current code for rendering
  const compilationResult = useCompilation(currentCode);
  const { Component, extractedProps } = compilationResult;

  // Create a modified remotionOutput with the current code for rendering
  const effectiveRemotionOutput = currentCode && compilationResult.compositionConfig
    ? {
        tsxCode: currentCode,
        compositionConfig: {
          id: String(compilationResult.compositionConfig.id ?? 'generated'),
          durationInSeconds: Number(compilationResult.compositionConfig.durationInSeconds ?? 15),
          fps: Number(compilationResult.compositionConfig.fps ?? 30),
          width: Number(compilationResult.compositionConfig.width ?? 1080),
          height: Number(compilationResult.compositionConfig.height ?? 1920),
        },
      } as RemotionOutput
    : null;

  // Client-side render hook
  const {
    isRendering,
    renderProgress,
    error: renderError,
    isSupported,
    abort,
    render,
  } = useClientRender({
    onComplete: (blob) => {
      // Trigger download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `viralcut-${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setShowRenderModal(false);
    },
    onError: (err) => {
      setDownloadError(err.message);
    },
  });

  const handleDownload = () => {
    if (!effectiveRemotionOutput || !Component) return;
    setShowRenderModal(true);
    setDownloadError(null);
    render(effectiveRemotionOutput, Component);
  };

  // Editor: handle code update from chat
  const handleEditorCodeUpdate = useCallback((newCode: string, _explanation: string) => {
    setRemotionCode(newCode);
    // Switch to preview tab to see the changes
    setActiveTab('preview');
  }, []);

  // Editor: handle code update from property editor
  const handlePropertyCodeChange = useCallback((newCode: string) => {
    setRemotionCode(newCode);
  }, []);

  if (status !== 'complete' || (!analysis && !remotionOutput)) return null;

  const tabs = [
    { id: 'preview' as const, label: 'Video Preview', icon: Play },
    ...(analysis ? [{ id: 'analysis' as const, label: 'Video Analysis', icon: BarChart3 }] : []),
    ...(strategy ? [{ id: 'strategy' as const, label: 'Strategy', icon: Eye }] : []),
    { id: 'editor' as const, label: 'Editor', icon: Wand2 },
    { id: 'code' as const, label: 'AI Code', icon: Code2 },
    { id: 'custom' as const, label: 'Custom Code', icon: Code2 },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto mt-12 fade-in">
      {/* Tab bar */}
      <div className="flex items-center gap-1 glass rounded-xl p-1 mb-6 w-fit mx-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === tab.id
                ? "bg-primary/20 text-primary-dim"
                : "text-text-muted hover:text-text-secondary"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="glass-strong rounded-2xl p-6 min-h-[400px]">
        {activeTab === 'preview' && effectiveRemotionOutput && (
          <RemotionPlayerBridge output={effectiveRemotionOutput} />
        )}
        
        {activeTab === 'analysis' && analysis && (
          <div className="space-y-6">
            {/* Summary stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard label="Duration" value={`${analysis.duration.toFixed(1)}s`} />
              <StatCard label="Scenes" value={String(analysis.scenes.length)} />
              <StatCard label="Pacing" value={`${analysis.pacing.pacingScore}/10`} />
              <StatCard label="Hook Strength" value={`${analysis.engagementProfile.hookStrength}/10`} />
            </div>

            {/* Scenes */}
            <div>
              <h4 className="text-sm font-semibold text-text-secondary uppercase tracking-widest mb-3">Scene Breakdown</h4>
              <div className="space-y-2">
                {analysis.scenes.map((scene, i) => (
                  <div key={i} className="glass rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono text-primary-dim">
                        {scene.startTime.toFixed(1)}s → {scene.endTime.toFixed(1)}s
                      </span>
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        scene.motion === 'fast' || scene.motion === 'chaotic' ? "bg-accent-amber/20 text-accent-amber" :
                        scene.motion === 'static' ? "bg-text-muted/20 text-text-muted" :
                        "bg-accent-green/20 text-accent-green"
                      )}>
                        {scene.motion}
                      </span>
                    </div>
                    <p className="text-sm text-text-primary">{scene.description}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {scene.dominantColors.map((col, j) => (
                        <span key={j} className="text-xs px-2 py-0.5 rounded-full bg-surface-high text-text-muted">
                          {col}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dropoff points */}
            {analysis.engagementProfile.retentionDropoffPoints.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-text-secondary uppercase tracking-widest mb-3">Retention Dropoff Points</h4>
                <div className="space-y-2">
                  {analysis.engagementProfile.retentionDropoffPoints.map((pt, i) => (
                    <div key={i} className="flex items-center gap-3 glass rounded-xl p-3">
                      <span className="text-xs font-mono text-accent-red">{pt.timestamp.toFixed(1)}s</span>
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        pt.severity === 'high' ? "bg-accent-red/20 text-accent-red" :
                        pt.severity === 'medium' ? "bg-accent-amber/20 text-accent-amber" :
                        "bg-text-muted/20 text-text-muted"
                      )}>
                        {pt.severity}
                      </span>
                      <span className="text-sm text-text-secondary flex-1">{pt.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'strategy' && strategy && (
          <div className="space-y-6">
            {/* Hook Strategy */}
            <div>
              <h4 className="text-sm font-semibold text-text-secondary uppercase tracking-widest mb-3">Hook Strategy</h4>
              <div className="glass rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary-dim">{strategy.hookStrategy.type}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-secondary/20 text-secondary-light">{strategy.hookStrategy.motionStyle}</span>
                </div>
                <p className="text-lg font-bold text-text-primary">&ldquo;{strategy.hookStrategy.textOverlay}&rdquo;</p>
                <p className="text-xs text-text-muted mt-1">
                  {strategy.hookStrategy.timing.start}s → {strategy.hookStrategy.timing.end}s
                </p>
              </div>
            </div>

            {/* Motion Graphics */}
            {strategy.motionGraphicPlacements.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-text-secondary uppercase tracking-widest mb-3">
                  Motion Graphics ({strategy.motionGraphicPlacements.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {strategy.motionGraphicPlacements.map((mg, i) => (
                    <div key={i} className="glass rounded-xl p-4">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-tertiary/20 text-tertiary mb-2 inline-block">{mg.type}</span>
                      <p className="text-sm text-text-primary font-medium">{mg.content}</p>
                      <p className="text-xs text-text-muted mt-1">
                        Position: ({mg.position.x}, {mg.position.y}) · {mg.timing.start}s → {mg.timing.end}s
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Retention Fixes */}
            {strategy.retentionFixes.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-text-secondary uppercase tracking-widest mb-3">
                  Retention Fixes ({strategy.retentionFixes.length})
                </h4>
                <div className="space-y-2">
                  {strategy.retentionFixes.map((fix, i) => (
                    <div key={i} className="flex items-start gap-3 glass rounded-xl p-3">
                      <span className="text-xs font-mono text-accent-amber shrink-0">{fix.targetTimestamp.toFixed(1)}s</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-accent-green/20 text-accent-green shrink-0">{fix.action}</span>
                      <span className="text-sm text-text-secondary">{fix.rationale}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'code' && remotionOutput && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <h4 className="text-sm font-semibold text-text-secondary uppercase tracking-widest">Generated TSX</h4>
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary-dim">
                {remotionOutput.compositionConfig.id}
              </span>
              <span className="text-xs text-text-muted font-mono ml-auto">
                {remotionOutput.compositionConfig.width}×{remotionOutput.compositionConfig.height} · {remotionOutput.compositionConfig.fps}fps · {remotionOutput.compositionConfig.durationInSeconds}s
              </span>
            </div>
            <pre className="code-block p-4 text-text-secondary whitespace-pre-wrap break-words text-xs leading-relaxed max-h-[600px] overflow-y-auto">
              {remotionOutput.tsxCode}
            </pre>
          </div>
        )}

        {activeTab === 'custom' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-text-secondary uppercase tracking-widest">Custom Remotion TSX Code</h4>
                <p className="text-xs text-text-muted mt-1">Paste your own Remotion component code to preview and render</p>
              </div>
              <button
                onClick={() => setUseCustomCode(!useCustomCode)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  useCustomCode
                    ? "bg-primary/20 text-primary-dim"
                    : "bg-surface-high text-text-muted hover:text-text-secondary"
                )}
              >
                {useCustomCode ? '✓ Using Custom Code' : 'Use Custom Code'}
              </button>
            </div>
            <textarea
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value)}
              placeholder={`Paste your Remotion TSX code here...

Example:
import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
} from 'remotion';

export const MyComponent = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 30], [0, 1]);
  
  return (
    <AbsoluteFill style={{ backgroundColor: '#09090B' }}>
      <div style={{ opacity, fontSize: 72, color: 'white', textAlign: 'center', marginTop: '40%' }}>
        Custom Content!
      </div>
    </AbsoluteFill>
  );
};

export default MyComponent;`}
              className="w-full h-[500px] bg-surface border border-border-ghost rounded-xl p-4 text-xs font-mono text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-primary/50"
              spellCheck={false}
            />
            {useCustomCode && customCode.trim() && (
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                <p className="text-xs text-primary-dim">
                  ✓ Custom code is active. Switch to the <strong>Video Preview</strong> tab to see your component.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'editor' && currentCode && (
          <div className="space-y-0">
            {/* Sub-tab switcher */}
            <div className="flex items-center gap-1 glass rounded-lg p-1 mb-4 w-fit">
              <button
                onClick={() => setEditorSubTab('props')}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                  editorSubTab === 'props'
                    ? "bg-primary/20 text-primary-dim"
                    : "text-text-muted hover:text-text-secondary"
                )}
              >
                <Palette className="w-3 h-3" /> Properties
              </button>
              <button
                onClick={() => setEditorSubTab('chat')}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                  editorSubTab === 'chat'
                    ? "bg-primary/20 text-primary-dim"
                    : "text-text-muted hover:text-text-secondary"
                )}
              >
                <Wand2 className="w-3 h-3" /> Chat
              </button>
            </div>

            {/* Editor content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Left: Preview */}
              <div>
                <div className="text-xs text-text-muted mb-2 uppercase tracking-wider font-semibold">Live Preview</div>
                {Component && compilationResult.compositionConfig ? (
                  <div className="aspect-[9/16] max-h-[500px] mx-auto rounded-xl overflow-hidden bg-black border border-white/10">
                    <Player
                      component={Component}
                      durationInFrames={Math.ceil((compilationResult.compositionConfig.durationInSeconds as number ?? 15) * (compilationResult.compositionConfig.fps as number ?? 30))}
                      compositionWidth={Number(compilationResult.compositionConfig.width ?? 1080)}
                      compositionHeight={Number(compilationResult.compositionConfig.height ?? 1920)}
                      fps={Number(compilationResult.compositionConfig.fps ?? 30)}
                      controls
                      style={{ width: '100%', height: '100%' }}
                    />
                  </div>
                ) : (
                  <div className="aspect-[9/16] max-h-[500px] mx-auto rounded-xl bg-black/20 border border-white/5 flex items-center justify-center">
                    <p className="text-sm text-text-muted">No component compiled</p>
                  </div>
                )}
              </div>

              {/* Right: Chat or Properties */}
              <div className="glass rounded-xl overflow-hidden">
                {editorSubTab === 'chat' && (
                  <ChatEditor
                    currentCode={currentCode}
                    onCodeUpdate={handleEditorCodeUpdate}
                  />
                )}
                {editorSubTab === 'props' && (
                  <PropertyEditor
                    code={currentCode}
                    onCodeChange={handlePropertyCodeChange}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action bar */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
        {effectiveRemotionOutput && (
          <button
            onClick={handleDownload}
            disabled={!isSupported || !Component}
            className="gradient-btn rounded-xl px-6 py-3 text-sm flex items-center gap-2 disabled:opacity-50 relative group"
            title={!isSupported ? 'Client-side rendering is not supported in your browser' : !Component ? 'Component not compiled yet' : 'Export as MP4'}
          >
            <Download className="w-4 h-4" /> Export High-Quality Video
          </button>
        )}
        <button onClick={reset} className="ghost-btn rounded-xl px-6 py-3 text-sm">
          ← Analyze another video
        </button>
      </div>
      {downloadError && (
        <p className="text-center text-xs text-accent-red mt-2">{downloadError}</p>
      )}
      {!isSupported && (
        <p className="text-center text-xs text-accent-amber mt-2 flex items-center justify-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Client-side rendering is not supported. Please use Chrome or Firefox for video export.
        </p>
      )}

      {/* Render Progress Modal */}
      {showRenderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass-strong rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                {isRendering ? (
                  <><Loader2 className="w-5 h-5 text-primary animate-spin" /> Rendering Video</>
                ) : renderError ? (
                  <><XCircle className="w-5 h-5 text-accent-red" /> Render Failed</>
                ) : (
                  <><CheckCircle2 className="w-5 h-5 text-accent-green" /> Render Complete</>
                )}
              </h3>
              {isRendering && (
                <button
                  onClick={abort}
                  className="text-xs text-text-muted hover:text-accent-red transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>

            {isRendering && renderProgress && (
              <div className="space-y-4">
                {/* Progress bar */}
                <div className="h-2 bg-surface-high rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-300"
                    style={{ width: `${renderProgress.progress * 100}%` }}
                  />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-surface-high rounded-xl p-3 text-center">
                    <p className="text-xl font-bold text-text-primary">{renderProgress.encodedFrames}</p>
                    <p className="text-xs text-text-muted">Frames Rendered</p>
                  </div>
                  <div className="bg-surface-high rounded-xl p-3 text-center">
                    <p className="text-xl font-bold text-text-primary">{(renderProgress.estimatedTimeRemaining / 1000).toFixed(1)}s</p>
                    <p className="text-xs text-text-muted">Est. Time Left</p>
                  </div>
                </div>

                <p className="text-center text-sm text-text-muted">
                  {(renderProgress.progress * 100).toFixed(0)}% complete · {renderProgress.encodedFrames}/{renderProgress.totalFrames} frames
                </p>

                <p className="text-xs text-text-muted text-center">
                  Keep this tab active for best performance
                </p>
              </div>
            )}

            {renderError && (
              <div className="p-4 rounded-xl bg-accent-red/10 border border-accent-red/20">
                <p className="text-sm text-accent-red">{renderError}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Stat Card ──
function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass rounded-xl p-4 text-center">
      <p className="text-2xl font-bold gradient-text">{value}</p>
      <p className="text-xs text-text-muted mt-1 uppercase tracking-wider">{label}</p>
    </div>
  );
}

// ── Feature Cards ──
function FeatureCards() {
  const features = [
    {
      icon: BarChart3,
      title: 'Video Analyzer',
      desc: 'AI breaks down scenes, pacing, engagement metrics, and audio profile',
      color: 'text-primary-dim',
      bg: 'bg-primary/10',
    },
    {
      icon: Eye,
      title: 'Engagement Strategist',
      desc: 'Data-driven retention fixes, hook strategies, and motion graphic placements',
      color: 'text-secondary-light',
      bg: 'bg-secondary/10',
    },
    {
      icon: Code2,
      title: 'Remotion Code Gen',
      desc: 'AI-generated TSX motion graphics — text slams, lower thirds, transitions',
      color: 'text-tertiary',
      bg: 'bg-tertiary/10',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl mx-auto mt-16">
      {features.map((f) => (
        <div key={f.title} className="glass rounded-2xl p-6 hover:glow-violet transition-shadow duration-300 group">
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4", f.bg)}>
            <f.icon className={cn("w-5 h-5", f.color)} />
          </div>
          <h3 className="text-base font-semibold text-text-primary mb-1">{f.title}</h3>
          <p className="text-sm text-text-muted leading-relaxed">{f.desc}</p>
        </div>
      ))}
    </div>
  );
}

// ── Main Page ──
export default function Home() {
  const { status } = useAppStore();
  const showResults = status === 'complete';

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <span className="text-xl font-bold gradient-text tracking-tight">ViralCut</span>
        <div className="flex items-center gap-4">
          <span className="text-xs text-text-muted px-3 py-1.5 rounded-full bg-surface-high">
            MVP Preview
          </span>
        </div>
      </nav>

      {/* Content */}
      <main className="relative z-10 px-6 pt-16 pb-24 max-w-6xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.1] mb-4">
            <span className="text-text-primary">Transform Video Into</span>
            <br />
            <span className="gradient-text">Viral Content</span>
          </h1>
          <p className="text-lg text-text-secondary max-w-xl mx-auto leading-relaxed">
            Upload a video, describe what you want, or attach reference images — AI creates production-ready Remotion motion graphics automatically.
          </p>
        </div>

        {/* Unified Input */}
        <UnifiedInput />

        {/* Progress or Results */}
        {!showResults && <PipelineProgress />}
        <ResultsView />

        {/* Features (only when idle) */}
        {status === 'idle' && <FeatureCards />}
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-8 border-t border-border-ghost">
        <p className="text-xs text-text-muted">
          ViralCut MVP · Video Analyzer + Motion Graphics Generator
        </p>
      </footer>
    </div>
  );
}
