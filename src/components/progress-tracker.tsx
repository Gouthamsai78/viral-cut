'use client';

import React from 'react';
import { CheckCircle2, Loader2, XCircle, Cpu, Zap, Code2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/app-store';

/**
 * Real-time progress tracker showing actual AI agent activity
 * No mock data - shows what's actually happening behind the scenes
 */

interface StepIndicatorProps {
  step: {
    name: string;
    description: string;
    status: 'pending' | 'running' | 'complete' | 'error';
  };
  index: number;
  total: number;
  isActive: boolean;
  agentInfo?: {
    agent?: string;
    model?: string;
    message?: string;
    details?: string;
  };
}

function StepIndicator({ step, index, total, isActive, agentInfo }: StepIndicatorProps) {
  const isLast = index === total - 1;

  const agentIcons: Record<string, React.ReactNode> = {
    'Video Analyzer': <Cpu className="w-4 h-4" />,
    'Engagement Strategist': <Zap className="w-4 h-4" />,
    'Remotion Code Generator': <Code2 className="w-4 h-4" />,
  };

  return (
    <div className="flex items-start gap-4">
      {/* Step number + connector */}
      <div className="flex flex-col items-center">
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500",
          step.status === 'complete' && "bg-accent-green text-white",
          step.status === 'running' && "bg-primary text-white pulse-glow",
          step.status === 'error' && "bg-accent-red text-white",
          step.status === 'pending' && "bg-surface-high text-text-muted border border-border-ghost"
        )}>
          {step.status === 'complete' ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : step.status === 'running' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : step.status === 'error' ? (
            <XCircle className="w-4 h-4" />
          ) : (
            String(index + 1).padStart(2, '0')
          )}
        </div>

        {/* Connector line */}
        {!isLast && (
          <div className="w-0.5 h-12 mt-2 relative">
            <div className="absolute inset-0 bg-surface-highest" />
            <div
              className={cn(
                "absolute inset-0 transition-all duration-700",
                step.status === 'complete' ? "bg-accent-green" : "bg-transparent"
              )}
              style={{
                transformOrigin: 'top',
                transform: step.status === 'complete' ? 'scaleY(1)' : 'scaleY(0)',
              }}
            />
          </div>
        )}
      </div>

      {/* Step content */}
      <div className="flex-1 pt-1 pb-8">
        <div className="flex items-center gap-2 mb-1">
          {agentInfo?.agent && agentIcons[agentInfo.agent] && (
            <span className="text-text-muted">
              {agentIcons[agentInfo.agent]}
            </span>
          )}
          <h4 className={cn(
            "text-sm font-semibold transition-colors",
            step.status === 'complete' && "text-accent-green",
            step.status === 'running' && "text-primary",
            step.status === 'error' && "text-accent-red",
            step.status === 'pending' && "text-text-muted"
          )}>
            {step.name}
          </h4>

          {step.status === 'running' && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium animate-pulse">
              Running
            </span>
          )}
        </div>

        {/* Real agent information */}
        {agentInfo && isActive && (
          <div className="space-y-1.5 mt-2">
            {agentInfo.model && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-text-muted">Model:</span>
                <code className="text-[10px] px-1.5 py-0.5 rounded bg-surface-highest text-primary-dim font-mono">
                  {agentInfo.model}
                </code>
              </div>
            )}
            {agentInfo.message && (
              <p className="text-xs text-text-secondary">
                {agentInfo.message}
              </p>
            )}
            {agentInfo.details && (
              <p className="text-[11px] text-text-muted leading-relaxed">
                {agentInfo.details}
              </p>
            )}
          </div>
        )}

        {/* Fallback description when no agent info */}
        {!agentInfo && (
          <p className="text-xs text-text-muted mt-1 leading-relaxed">
            {step.description}
          </p>
        )}
      </div>
    </div>
  );
}

// Main progress tracker
export function ProgressTracker() {
  const { steps, status, error, currentStatus } = useAppStore();

  if (status === 'idle') return null;

  // Calculate progress percentage
  const completedSteps = steps.filter(s => s.status === 'complete').length;
  const baseProgress = 5;
  const liveProgress = currentStatus?.progress || 0;
  const progressPercentage = status === 'complete' ? 100 : (liveProgress > 0 ? liveProgress : baseProgress + (completedSteps / steps.length) * 95);

  return (
    <div className="w-full max-w-xl mx-auto mt-12 fade-in">
      <div className="glass-strong rounded-2xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-heading text-base text-text-primary">
            {status === 'complete' ? '✅ Your Masterpiece is Ready!' :
             status === 'error' ? '❌ Processing Failed' :
             '🎬 AI is Working...'}
          </h3>

          {status !== 'error' && status !== 'complete' && currentStatus && (
            <span className="text-xs text-text-muted font-mono">
              {currentStatus.progress}%
            </span>
          )}
        </div>

        {/* Steps with real-time agent info */}
        <div className="mb-6">
          {steps.map((step, i) => (
            <StepIndicator
              key={step.name}
              step={step}
              index={i}
              total={steps.length}
              isActive={currentStatus?.stepIndex === i}
              agentInfo={
                currentStatus && currentStatus.stepIndex === i
                  ? {
                      agent: currentStatus.agent,
                      model: currentStatus.model,
                      message: currentStatus.message,
                      details: currentStatus.details,
                    }
                  : undefined
              }
            />
          ))}
        </div>

        {/* Progress bar */}
        <div className="relative h-2 bg-surface-highest rounded-full overflow-hidden">
          {/* Background shimmer */}
          <div className="absolute inset-0 shimmer opacity-50" />

          {/* Progress fill */}
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500 ease-out relative",
              status === 'error' ? "bg-accent-red" : "progress-shimmer"
            )}
            style={{
              width: `${progressPercentage}%`,
            }}
          />
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-4 p-3 rounded-xl bg-accent-red/10 border border-accent-red/20">
            <p className="text-sm text-accent-red">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
