'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, Loader2, Clock, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/app-store';

/**
 * Progress tracker with Zeigarnik effect
 * Creates psychological tension with incomplete states to drive completion
 */

// Rotating motivational messages
const loadingMessages = [
  { text: "AI is watching your video", emoji: "👀" },
  { text: "Finding the perfect hook", emoji: "🎯" },
  { text: "Optimizing for maximum retention", emoji: "📈" },
  { text: "Adding motion graphics", emoji: "✨" },
  { text: "Crafting your masterpiece", emoji: "🎬" },
  { text: "Analyzing engagement patterns", emoji: "🧠" },
  { text: "Generating viral strategies", emoji: "🚀" },
];

interface StepIndicatorProps {
  step: {
    name: string;
    description: string;
    status: 'pending' | 'running' | 'complete' | 'error';
  };
  index: number;
  total: number;
}

function StepIndicator({ step, index, total }: StepIndicatorProps) {
  const isLast = index === total - 1;

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
        <div className="flex items-center gap-2">
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
              In Progress
            </span>
          )}
        </div>

        <p className="text-xs text-text-muted mt-1 leading-relaxed">
          {step.description}
        </p>

        {/* Running state - show motivational message */}
        {step.status === 'running' && <MotivationalMessage />}
      </div>
    </div>
  );
}

// Rotating message component
function MotivationalMessage() {
  const [messageIndex, setMessageIndex] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const message = loadingMessages[messageIndex];

  return (
    <div className="mt-2 text-xs text-text-secondary animate-pulse flex items-center gap-1.5">
      <span>{message.emoji}</span>
      <span>{message.text}...</span>
    </div>
  );
}

// Main progress tracker
export function ProgressTracker() {
  const { steps, status, error } = useAppStore();

  if (status === 'idle') return null;

  // Calculate progress percentage (starts at 5% for endowed progress effect)
  const completedSteps = steps.filter(s => s.status === 'complete').length;
  const baseProgress = 5;
  const stepProgress = (completedSteps / steps.length) * 95;
  const progressPercentage = baseProgress + stepProgress;

  return (
    <div className="w-full max-w-xl mx-auto mt-12 fade-in">
      <div className="glass-strong rounded-2xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-heading text-base text-text-primary">
            Creating Your Masterpiece
          </h3>

          {status !== 'error' && status !== 'complete' && (
            <span className="text-xs text-text-muted font-mono">
              {completedSteps}/{steps.length} complete
            </span>
          )}
        </div>

        {/* Steps */}
        <div className="mb-6">
          {steps.map((step, i) => (
            <StepIndicator
              key={step.name}
              step={step}
              index={i}
              total={steps.length}
            />
          ))}
        </div>

        {/* Progress bar with endowed progress */}
        <div className="relative h-2 bg-surface-highest rounded-full overflow-hidden">
          {/* Background shimmer */}
          <div className="absolute inset-0 shimmer opacity-50" />
          
          {/* Progress fill */}
          <div
            className={cn(
              "h-full rounded-full transition-all duration-1000 ease-out relative",
              status === 'error' ? "bg-accent-red" : "progress-shimmer"
            )}
            style={{
              width: status === 'complete' ? '100%' : `${progressPercentage}%`,
            }}
          />
        </div>

        {/* Completion message */}
        {status === 'complete' && (
          <div className="mt-4 p-3 rounded-xl bg-accent-green/10 border border-accent-green/20 text-center">
            <p className="text-sm text-accent-green font-medium">
              🎉 Your masterpiece is ready!
            </p>
          </div>
        )}

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
