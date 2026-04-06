'use client';

import type { RemotionOutput } from '@/agents/schemas';

import React, { useState, useRef } from 'react';
import { useAppStore } from '@/stores/app-store';
import { Zap, Sparkles, Film, Loader2, CheckCircle2, XCircle, Clock, Code2, BarChart3, Eye, Download, Play, Upload, MousePointer2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Player } from '@remotion/player';
import { useCompilation } from '@/hooks/use-compilation';

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

// ── Video Input (URL or File) ──
function VideoInput() {
  const { setVideoUrl, setVideoFile, runPipeline, status } = useAppStore();
  const [localUrl, setLocalUrl] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isRunning = status !== 'idle' && status !== 'complete' && status !== 'error';

  const handleFile = (file: File) => {
    if (!file.type.startsWith('video/')) {
       alert("Please upload a video file.");
       return;
    }
    const url = URL.createObjectURL(file);
    setVideoFile(file);
    setVideoUrl(url);
    runPipeline();
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!localUrl.trim()) return;
    setVideoUrl(localUrl.trim());
    setVideoFile(null);
    runPipeline();
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* URL Input */}
      <form onSubmit={handleUrlSubmit} className="">
        <div className="glass rounded-2xl p-1.5 flex items-center gap-2">
          <div className="flex items-center gap-3 flex-1 px-4">
            <Film className="w-5 h-5 text-text-muted shrink-0" />
            <input
              type="url"
              value={localUrl}
              onChange={(e) => setLocalUrl(e.target.value)}
              placeholder="Paste a public video URL (e.g. mp4 link)..."
              className="flex-1 bg-transparent text-text-primary placeholder:text-text-muted outline-none py-3 text-[15px]"
              disabled={isRunning}
            />
          </div>
          <button
            type="submit"
            disabled={isRunning || !localUrl.trim()}
            className="gradient-btn rounded-xl px-6 py-3 text-sm font-semibold flex items-center gap-2 shrink-0 disabled:opacity-40"
          >
            {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            Enhance URL
          </button>
        </div>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-white/10"></span>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-4 text-text-muted font-medium">Or upload locally</span>
        </div>
      </div>

      {/* Upload Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "relative group cursor-pointer h-40 glass-strong border-2 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all duration-300",
          dragActive ? "border-primary bg-primary/5 scale-[1.01]" : "border-white/10 hover:border-white/20 hover:bg-white/5",
          isRunning && "opacity-50 pointer-events-none"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
        
        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
          <Upload className="w-6 h-6 text-primary-dim" />
        </div>
        
        <div className="text-center">
          <p className="text-sm font-semibold text-text-primary">Click to upload or drag and drop</p>
          <p className="text-xs text-text-muted mt-1">MP4, MOV, WEBM (Max 50MB)</p>
        </div>

        {dragActive && (
          <div className="absolute inset-0 bg-primary/10 rounded-3xl flex items-center justify-center backdrop-blur-[2px]">
            <MousePointer2 className="w-8 h-8 text-primary animate-bounce" />
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

// ── Download helper (Server-Side MP4 Render) ──
async function downloadVideo(remotionOutput: RemotionOutput) {
  const res = await fetch('/api/render', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      tsxCode: remotionOutput.tsxCode,
      compositionConfig: remotionOutput.compositionConfig,
    }),
  });
  
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Rendering failed');
  }
  
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `viralcut-${Date.now()}.mp4`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Results View ──
function ResultsView() {
  const { analysis, strategy, remotionOutput, status, reset } = useAppStore();
  const [activeTab, setActiveTab] = useState<'preview' | 'analysis' | 'strategy' | 'code' | 'custom'>('preview');
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [customCode, setCustomCode] = useState('');
  const [useCustomCode, setUseCustomCode] = useState(false);

  // Create a modified remotionOutput with custom code if enabled
  const effectiveRemotionOutput = useCustomCode && customCode.trim()
    ? { ...remotionOutput!, tsxCode: customCode }
    : remotionOutput;

  const handleDownload = async () => {
    if (!effectiveRemotionOutput) return;
    setDownloading(true);
    setDownloadError(null);
    try {
      await downloadVideo(effectiveRemotionOutput);
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setDownloading(false);
    }
  };

  if (status !== 'complete' || !analysis) return null;

  const tabs = [
    { id: 'preview' as const, label: 'Video Preview', icon: Play },
    { id: 'analysis' as const, label: 'Video Analysis', icon: BarChart3 },
    { id: 'strategy' as const, label: 'Strategy', icon: Eye },
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
      </div>

      {/* Action bar */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
        {effectiveRemotionOutput && (
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="gradient-btn rounded-xl px-6 py-3 text-sm flex items-center gap-2 disabled:opacity-50"
          >
            {downloading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Rendering MP4...</>
            ) : (
              <><Download className="w-4 h-4" /> Export High-Quality Video</>
            )}
          </button>
        )}
        <button onClick={reset} className="ghost-btn rounded-xl px-6 py-3 text-sm">
          ← Analyze another video
        </button>
      </div>
      {downloadError && (
        <p className="text-center text-xs text-accent-red mt-2">{downloadError}</p>
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
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-primary-dim" />
            <span className="text-xs text-text-secondary font-medium">Powered by Gemini 2.5 Flash</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.1] mb-4">
            <span className="text-text-primary">Transform Video Into</span>
            <br />
            <span className="gradient-text">Viral Content</span>
          </h1>
          <p className="text-lg text-text-secondary max-w-xl mx-auto leading-relaxed">
            AI analyzes your video, generates engagement strategies, and creates
            production-ready Remotion motion graphics — automatically.
          </p>
        </div>

        {/* Input */}
        <VideoInput />

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
