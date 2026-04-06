import { generateText, Output } from 'ai';
import { EngagementStrategySchema, type EngagementStrategy, type VideoAnalysis } from './schemas';
import { AI_MODELS } from '@/lib/ai-config';

export async function generateStrategy(analysis: VideoAnalysis): Promise<EngagementStrategy> {
  const { output } = await generateText({
    model: AI_MODELS.strategy,
    output: Output.object({ schema: EngagementStrategySchema }),
    messages: [
      {
        role: 'system',
        content: `You are a viral content strategist who has studied the top 1% of
performing content across TikTok, Instagram Reels, and YouTube Shorts.

Given a video analysis, produce a surgical engagement strategy:

HOOK (first 1-3 seconds):
- Choose from: question, shock, tease, stat, controversy
- Specify exact text overlay and motion style (slam, typewriter, glitch, fade-zoom, bounce)

RETENTION FIXES:
- For each dropoff point, specify exact fix action
- Actions: cut, speedRamp, addOverlay, addSFX, addTransition, addBroll

MOTION GRAPHICS:
- Lower thirds, callouts, counters, full overlays, side panels, pip
- Position (x/y as percentages), timing, and style for each

PACING EDITS:
- Speed multipliers for slow segments (1.0 = normal, 1.5 = 50% faster)

SFX CUES:
- whoosh/impact/riser/drop/notification/ambient/pop/swoosh with intensity

Every recommendation must have a rationale.`,
      },
      {
        role: 'user',
        content: `Generate the engagement strategy for this video analysis:\n${JSON.stringify(analysis, null, 2)}`,
      },
    ],
  });

  return output;
}

