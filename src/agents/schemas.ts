import { z } from 'zod';

// ── Agent 1: Video Analyzer Output ──
export const VideoAnalysisSchema = z.object({
  duration: z.number().positive('Duration must be positive'),
  scenes: z.array(z.object({
    startTime: z.number().min(0, 'Start time cannot be negative'),
    endTime: z.number(),
    description: z.string().min(1, 'Description cannot be empty'),
    visualElements: z.array(z.string()),
    dominantColors: z.array(z.string()),
    motion: z.enum(['static', 'slow', 'moderate', 'fast', 'chaotic']),
    speechContent: z.string().optional(),
    emotionalTone: z.string(),
  })).refine(
    (scenes) => scenes.every(s => s.endTime > s.startTime),
    'Each scene must have endTime greater than startTime'
  ),
  pacing: z.object({
    averageShotLength: z.number().positive('Average shot length must be positive'),
    pacingScore: z.number().min(1, 'Pacing score must be between 1-10').max(10, 'Pacing score must be between 1-10'),
    pacingNotes: z.string(),
  }),
  engagementProfile: z.object({
    hookStrength: z.number().min(1, 'Hook strength must be between 1-10').max(10, 'Hook strength must be between 1-10'),
    retentionDropoffPoints: z.array(z.object({
      timestamp: z.number().min(0, 'Timestamp cannot be negative'),
      reason: z.string(),
      severity: z.enum(['low', 'medium', 'high']),
    })),
    nativeStrengths: z.array(z.string()),
    unoptimizedGaps: z.array(z.object({
      startTime: z.number().min(0, 'Start time cannot be negative'),
      endTime: z.number(),
      issue: z.string(),
      suggestion: z.string(),
    })).refine(
      (gaps) => gaps.every(g => g.endTime > g.startTime),
      'Each gap must have endTime greater than startTime'
    ),
  }),
  audioProfile: z.object({
    hasSpeech: z.boolean(),
    hasMusic: z.boolean(),
    silentSegments: z.array(z.object({ 
      start: z.number().min(0, 'Start cannot be negative'), 
      end: z.number() 
    })).refine(
      (segments) => segments.every(s => s.end > s.start),
      'Each silent segment must have end greater than start'
    ),
    audioMoods: z.array(z.string()),
  }),
});

// ── Agent 2: Engagement Strategist Output ──
export const EngagementStrategySchema = z.object({
  hookStrategy: z.object({
    type: z.enum(['question', 'shock', 'tease', 'stat', 'controversy']),
    textOverlay: z.string().min(1, 'Text overlay cannot be empty'),
    timing: z.object({ 
      start: z.number().min(0, 'Start cannot be negative'), 
      end: z.number() 
    }).refine(t => t.end > t.start, 'Hook end must be greater than start'),
    motionStyle: z.enum(['slam', 'typewriter', 'glitch', 'fade-zoom', 'bounce']),
  }),
  retentionFixes: z.array(z.object({
    targetTimestamp: z.number().min(0, 'Timestamp cannot be negative'),
    action: z.enum(['cut', 'speedRamp', 'addOverlay', 'addSFX', 'addTransition', 'addBroll']),
    params: z.record(z.string(), z.unknown()),
    rationale: z.string(),
  })),
  motionGraphicPlacements: z.array(z.object({
    type: z.enum(['lowerThird', 'fullOverlay', 'sidePanel', 'pip', 'callout', 'counter']),
    content: z.string(),
    position: z.object({ x: z.string(), y: z.string() }),
    timing: z.object({ 
      start: z.number().min(0, 'Start cannot be negative'), 
      end: z.number() 
    }).refine(t => t.end > t.start, 'Timing end must be greater than start'),
    style: z.string(),
  })),
  transitions: z.array(z.object({
    atTimestamp: z.number().min(0, 'Timestamp cannot be negative'),
    type: z.enum(['whipPan', 'glitch', 'zoom', 'dissolve', 'smash', 'luma']),
    duration: z.number().positive('Duration must be positive'),
  })),
  pacingEdits: z.array(z.object({
    segment: z.object({ 
      start: z.number().min(0, 'Start cannot be negative'), 
      end: z.number() 
    }).refine(s => s.end > s.start, 'Segment end must be greater than start'),
    speedMultiplier: z.number().positive('Speed multiplier must be positive').min(0.1, 'Speed multiplier should be reasonable').max(5.0, 'Speed multiplier should be reasonable'),
    reason: z.string(),
  })),
  sfxCues: z.array(z.object({
    timestamp: z.number().min(0, 'Timestamp cannot be negative'),
    category: z.enum(['whoosh', 'impact', 'riser', 'drop', 'notification', 'ambient', 'pop', 'swoosh']),
    intensity: z.enum(['subtle', 'medium', 'heavy']),
    context: z.string(),
  })),
  ctaPlacement: z.object({
    text: z.string().min(1, 'CTA text cannot be empty'),
    timestamp: z.number().min(0, 'Timestamp cannot be negative'),
    style: z.string(),
  }).optional(),
});

// ── Agent 3: Remotion Code Generator Output ──
export const RemotionComponentSchema = z.object({
  tsxCode: z.string()
    .min(100, 'TSX code must be a complete implementation')
    .describe('The complete, self-contained Remotion TSX file content')
    .refine(
      (code) => code.includes('export default'),
      'Code must contain an export default statement'
    )
    .refine(
      (code) => code.includes('compositionConfig'),
      'Code must define compositionConfig'
    )
    .refine(
      (code) => code.includes('DEFAULT_PROPS'),
      'Code must define DEFAULT_PROPS for runtime editing'
    ),
  compositionConfig: z.object({
    id: z.string().describe('PascalCase composition ID'),
    durationInSeconds: z.number().positive('Duration must be positive').max(300, 'Duration too long (max 5 minutes)'),
    fps: z.number().positive('FPS must be positive').min(1).max(60, 'FPS must be between 1-60'),
    width: z.number().positive('Width must be positive').min(360).max(3840, 'Width must be between 360-3840'),
    height: z.number().positive('Height must be positive').min(640).max(2160, 'Height must be between 640-2160'),
  }),
});

// ── Type exports ──
export type VideoAnalysis = z.infer<typeof VideoAnalysisSchema>;
export type EngagementStrategy = z.infer<typeof EngagementStrategySchema>;
export type RemotionOutput = z.infer<typeof RemotionComponentSchema>;
