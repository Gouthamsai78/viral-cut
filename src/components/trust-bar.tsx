'use client';

import React, { useState, useEffect } from 'react';
import { Users, Zap, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Social proof components
 * Builds trust through activity indicators and creator validation
 */

// Animated counter for live activity
function LiveCounter({ target, suffix = '', duration = 2000 }: { target: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [target, duration]);

  return (
    <span className="tabular-nums">
      {count.toLocaleString()}{suffix}
    </span>
  );
}

// Avatar stack component
function AvatarStack({ count }: { count: number }) {
  // Simulated avatar colors for MVP
  const colors = [
    'bg-gradient-to-br from-primary to-primary-dark',
    'bg-gradient-to-br from-secondary to-secondary-dark',
    'bg-gradient-to-br from-tertiary to-purple-700',
    'bg-gradient-to-br from-accent-warm to-orange-600',
    'bg-gradient-to-br from-accent-teal to-emerald-600',
  ];

  return (
    <div className="flex items-center -space-x-2">
      {colors.slice(0, Math.min(5, Math.floor(count / 500) + 1)).map((color, i) => (
        <div
          key={i}
          className={cn(
            'w-7 h-7 rounded-full border-2 border-background flex items-center justify-center text-[10px] font-semibold text-white',
            color
          )}
        >
          {String.fromCharCode(65 + i)}
        </div>
      ))}
      <div className="w-7 h-7 rounded-full border-2 border-background bg-surface-high flex items-center justify-center text-[9px] font-medium text-text-muted">
        +{count - 5}
      </div>
    </div>
  );
}

// Main trust bar component
export function TrustBar({ variant = 'hero' }: { variant?: 'hero' | 'compact' }) {
  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-4 text-xs text-text-muted">
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-accent-warm" />
          <span><LiveCounter target={142} suffix=" videos today" /></span>
        </div>
        <div className="flex items-center gap-1.5">
          <Award className="w-3.5 h-3.5 text-accent-green" />
          <span>8.7/10 avg quality</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 py-6">
      {/* Live activity */}
      <div className="flex items-center gap-3 glass-subtle rounded-xl px-4 py-2.5">
        <div className="relative">
          <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
          <div className="absolute inset-0 w-2 h-2 rounded-full bg-accent-green animate-ping opacity-75" />
        </div>
        <div className="flex items-center gap-1.5 text-sm">
          <Zap className="w-4 h-4 text-accent-warm" />
          <span className="text-text-secondary">
            <LiveCounter target={142} suffix=" videos created today" />
          </span>
        </div>
      </div>

      {/* Creator count */}
      <div className="flex items-center gap-3">
        <AvatarStack count={2400} />
        <div className="text-sm">
          <p className="text-text-secondary">Trusted by <span className="font-semibold text-text-primary">2,400+</span> creators</p>
        </div>
      </div>

      {/* Quality metric */}
      <div className="flex items-center gap-1.5 text-sm text-text-muted">
        <Award className="w-4 h-4 text-accent-green" />
        <span>8.7/10 average engagement score</span>
      </div>
    </div>
  );
}
