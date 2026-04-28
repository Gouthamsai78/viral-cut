import { generateText, Output } from 'ai';
import { RemotionComponentSchema, type RemotionOutput, type VideoAnalysis, type EngagementStrategy } from './schemas';
import { AI_MODELS } from '@/lib/ai-config';

// ============================================================================
// SYSTEM PROMPT FOR STRUCTURED DATA GENERATION
// ============================================================================
const SYSTEM_PROMPT = `You are an Elite Remotion TSX Video Creator.

### 🚨 CRITICAL ZOD SCHEMA VALIDATION 🚨
Your output is strictly validated by a system schema. IT WILL CRASH AND FAIL if your code does not contain the exact variable name "DEFAULT_PROPS".
❌ FORBIDDEN: Do NOT use "const COLORS = { ... }" or "const CONFIG = { ... }".
✅ REQUIRED: You MUST declare your configuration like this:
\`\`\`tsx
const DEFAULT_PROPS = {
  primaryColor: '#00F0FF',
  backgroundColor: '#05050A',
  titleText: 'HELLO'
} as const;
\`\`\`

---

## 🛑 STRICT REMOTION RULES
1. **NO HTML MEDIA:** NEVER use standard \`<img>\`, \`<video>\`, or \`<audio>\` tags. You MUST use Remotion's \`<Img>\`, \`<Video>\`, and \`<Audio>\`.
2. **NO REACT HOOKS:** NO \`useState\`, \`useEffect\`, timeouts, or CSS \`@keyframes\`. Use \`useCurrentFrame()\` and \`interpolate()\` for ALL animation.
3. **NO MATH.RANDOM:** NO \`Math.random()\`. You MUST use Remotion's \`random('seed')\` function.
4. **NO UNSUPPORTED CSS:** NO \`filter\`, \`backdrop-filter\`, \`mix-blend-mode\`, or \`clip-path\`. These will crash the Vercel/Lambda renderer.

## 📐 ANIMATION & DESIGN
- ALWAYS animate values using \`interpolate(frame, [...], [...], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })\`.
- Use \`spring({ fps, frame, config: { damping: 12 } })\` for scale/bounce motion.
- Make the design hyper-modern: Use procedural CSS grid backgrounds, large kinetic typography, and glowing borders.
`;

export async function generateRemotionCode(
  analysis: VideoAnalysis,
  strategy: EngagementStrategy,
  imageUrls?: string[],
): Promise<RemotionOutput> {
  const imageInstructions = imageUrls && imageUrls.length > 0 
    ? `\nIMPORTANT: Use these images with Remotion's <Img src="URL" /> component:\n${imageUrls.map((url, i) => `<image_${i + 1}>${url}</image_${i + 1}>`).join('\n')}` 
    : '';

  const userContent = `Generate a 15-second vertical (1080x1920) Remotion TSX video at 30fps for this strategy.

<video_analysis>
${JSON.stringify(analysis, null, 2)}
</video_analysis>

<engagement_strategy>
${JSON.stringify(strategy, null, 2)}
</engagement_strategy>
${imageInstructions}

CRITICAL REQUIREMENT:
You MUST name your configuration object exactly "DEFAULT_PROPS". Replace any "COLORS" or "CONFIG" objects with "DEFAULT_PROPS". Do not fail this validation.`;

  const { output } = await generateText({
    model: AI_MODELS.codeGen,
    output: Output.object({ schema: RemotionComponentSchema }),
    messages:[
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userContent },
    ],
  });

  return output;
}

// ============================================================================
// SYSTEM PROMPT FOR TEXT-TO-VIDEO GENERATION
// ============================================================================
const PROMPT_SYSTEM = `You are an Elite Remotion TSX Video Creator.

### 🚨 CRITICAL ZOD SCHEMA VALIDATION 🚨
Your output is strictly validated by a system schema. IT WILL CRASH AND FAIL if your code does not contain the exact variable name "DEFAULT_PROPS".
❌ FORBIDDEN: Do NOT use "const COLORS = { ... }" or "const CONFIG = { ... }".
✅ REQUIRED: You MUST declare your configuration like this:
\`\`\`tsx
const DEFAULT_PROPS = {
  primaryColor: '#00F0FF',
  backgroundColor: '#05050A',
  titleText: 'HELLO'
} as const;
\`\`\`

---

## 🛑 STRICT REMOTION RULES
1. **NO HTML MEDIA:** NEVER use standard \`<img>\`, \`<video>\`, or \`<audio>\` tags. You MUST use Remotion's \`<Img>\`, \`<Video>\`, and \`<Audio>\`.
2. **NO REACT HOOKS:** NO \`useState\`, \`useEffect\`, timeouts, or CSS \`@keyframes\`. Use \`useCurrentFrame()\` and \`interpolate()\` for ALL animation.
3. **NO MATH.RANDOM:** NO \`Math.random()\`. You MUST use Remotion's \`random('seed')\` function.
4. **NO UNSUPPORTED CSS:** NO \`filter\`, \`backdrop-filter\`, \`mix-blend-mode\`, or \`clip-path\`. These will crash the Vercel/Lambda renderer.

## 📐 MANDATORY CODE STRUCTURE
You must output ONLY valid TSX using this exact format:

\`\`\`tsx
import React from 'react';
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame, useVideoConfig, spring, Easing, Img, random } from 'remotion';

export const compositionConfig = {
  id: 'MyVideo',
  durationInSeconds: 15,
  fps: 30,
  width: 1080,
  height: 1920,
};

// YOU MUST USE THIS EXACT VARIABLE NAME:
const DEFAULT_PROPS = {
  primaryColor: '#FF00FF',
  secondaryColor: '#00FFFF',
  backgroundColor: '#0A0A0F',
  headlineText: 'My Video',
} as const;

const MyVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const { primaryColor, backgroundColor, headlineText } = DEFAULT_PROPS;

  return (
    <AbsoluteFill style={{ backgroundColor }}>
      {/* Content here */}
    </AbsoluteFill>
  );
};

export default MyVideo;
\`\`\`
`;

export async function generateRemotionFromPrompt(
  prompt: string,
  imageUrls?: string[],
): Promise<RemotionOutput> {
  const imageInstructions = imageUrls && imageUrls.length > 0 
    ? `\nIMPORTANT: Use these images with <Img src="URL" />:\n${imageUrls.map((url, i) => `<image_${i + 1}>${url}</image_${i + 1}>`).join('\n')}` 
    : '';

  const userContent = prompt + imageInstructions + "\n\nCRITICAL REQUIREMENT: You MUST name your configuration object exactly 'DEFAULT_PROPS'. Replace any 'COLORS' or 'CONFIG' objects with 'DEFAULT_PROPS'. Do not fail this Zod validation.";

  const { output } = await generateText({
    model: AI_MODELS.codeGen,
    output: Output.object({ schema: RemotionComponentSchema }),
    messages:[
      { role: 'system', content: PROMPT_SYSTEM },
      { role: 'user', content: userContent },
    ],
  });

  if (typeof output.tsxCode !== 'string') {
    throw new Error('Invalid TSX output received from AI model');
  }

  // Strip strictly unsupported CSS properties that cause fatal render crashes
  let cleanedCode = output.tsxCode.replace(
    /\b(filter|mixBlendMode|backdropFilter|clipPath)\s*:\s*[^,}]+[,}]?/gi,
    ''
  );
  
  // Strip staticFile() hallucinations
  cleanedCode = cleanedCode.replace(/staticFile\(["'][^"']*?["']\)/g, '""');

  return { ...output, tsxCode: cleanedCode };
}
