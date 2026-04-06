import { z } from 'zod';

// ── Agent 1: Video Analyzer Output ──
export const VideoAnalysisSchema = z.object({
  duration: z.number(),
  scenes: z.array(z.object({
    startTime: z.number(),
    endTime: z.number(),
    description: z.string(),
    visualElements: z.array(z.string()),
    dominantColors: z.array(z.string()),
    motion: z.enum(['static', 'slow', 'moderate', 'fast', 'chaotic']),
    speechContent: z.string().optional(),
    emotionalTone: z.string(),
  })),
  pacing: z.object({
    averageShotLength: z.number(),
    pacingScore: z.number(),
    pacingNotes: z.string(),
  }),
  engagementProfile: z.object({
    hookStrength: z.number(),
    retentionDropoffPoints: z.array(z.object({
      timestamp: z.number(),
      reason: z.string(),
      severity: z.enum(['low', 'medium', 'high']),
    })),
    nativeStrengths: z.array(z.string()),
    unoptimizedGaps: z.array(z.object({
      startTime: z.number(),
      endTime: z.number(),
      issue: z.string(),
      suggestion: z.string(),
    })),
  }),
  audioProfile: z.object({
    hasSpeech: z.boolean(),
    hasMusic: z.boolean(),
    silentSegments: z.array(z.object({ start: z.number(), end: z.number() })),
    audioMoods: z.array(z.string()),
  }),
});

// ── Agent 2: Engagement Strategist Output ──
export const EngagementStrategySchema = z.object({
  hookStrategy: z.object({
    type: z.enum(['question', 'shock', 'tease', 'stat', 'controversy']),
    textOverlay: z.string(),
    timing: z.object({ start: z.number(), end: z.number() }),
    motionStyle: z.enum(['slam', 'typewriter', 'glitch', 'fade-zoom', 'bounce']),
  }),
  retentionFixes: z.array(z.object({
    targetTimestamp: z.number(),
    action: z.enum(['cut', 'speedRamp', 'addOverlay', 'addSFX', 'addTransition', 'addBroll']),
    params: z.record(z.string(), z.unknown()),
    rationale: z.string(),
  })),
  motionGraphicPlacements: z.array(z.object({
    type: z.enum(['lowerThird', 'fullOverlay', 'sidePanel', 'pip', 'callout', 'counter']),
    content: z.string(),
    position: z.object({ x: z.string(), y: z.string() }),
    timing: z.object({ start: z.number(), end: z.number() }),
    style: z.string(),
  })),
  transitions: z.array(z.object({
    atTimestamp: z.number(),
    type: z.enum(['whipPan', 'glitch', 'zoom', 'dissolve', 'smash', 'luma']),
    duration: z.number(),
  })),
  pacingEdits: z.array(z.object({
    segment: z.object({ start: z.number(), end: z.number() }),
    speedMultiplier: z.number(),
    reason: z.string(),
  })),
  sfxCues: z.array(z.object({
    timestamp: z.number(),
    category: z.enum(['whoosh', 'impact', 'riser', 'drop', 'notification', 'ambient', 'pop', 'swoosh']),
    intensity: z.enum(['subtle', 'medium', 'heavy']),
    context: z.string(),
  })),
  ctaPlacement: z.object({
    text: z.string(),
    timestamp: z.number(),
    style: z.string(),
  }).optional(),
});

// ── Agent 3: Remotion Code Generator Output ──
export const RemotionComponentSchema = z.object({
  tsxCode: z.string().describe('The complete, self-contained Remotion TSX file content'),
  compositionConfig: z.object({
    id: z.string().describe('PascalCase composition ID'),
    durationInSeconds: z.number(),
    fps: z.number(),
    width: z.number(),
    height: z.number(),
  }),
});

// ── Type exports ──
export type VideoAnalysis = z.infer<typeof VideoAnalysisSchema>;
export type EngagementStrategy = z.infer<typeof EngagementStrategySchema>;
export type RemotionOutput = z.infer<typeof RemotionComponentSchema>;
