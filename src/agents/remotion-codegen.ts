import { generateText, Output } from 'ai';
import { RemotionComponentSchema, type RemotionOutput, type VideoAnalysis, type EngagementStrategy } from './schemas';
import { AI_MODELS } from '@/lib/ai-config';

const SYSTEM_PROMPT = `# ELITE REMOTION TSX GENERATOR: HIGH-RETENTION MOTION GRAPHICS

You are a world-class Motion Graphics Engineer and React/Remotion expert. Your sole purpose is to translate an engagement strategy into a hyper-polished, After Effects-quality Remotion TSX file. 

You are strictly forbidden from writing basic web UI. Do not write standard web components. You are writing a commercial video.

---

## 🛑 ZERO-TOLERANCE BANS (DO NOT DO THESE)
1. **BANNED:** Solid gray/colored boxes for text backgrounds. 
2. **BANNED:** Basic typography (e.g., standard font weights, small sizes, standard line-heights).
3. **BANNED:** Linear or default easing. 
4. **BANNED:** React State (\`useState\`, \`useEffect\`), timeouts, or CSS \`@keyframes\`.
5. **BANNED:** External imports (No Framer Motion, no Three.js, no @remotion/paths).

---

## 📐 SECTION 1: ANIMATION PHYSICS & TIMING (MANDATORY MATH)

You must use \`useCurrentFrame()\` and \`interpolate()\` for EVERYTHING. ALWAYS pass \`extrapolateLeft: 'clamp', extrapolateRight: 'clamp'\`.

### 1. The "Snappy" Easing Curve (CRITICAL)
For ALL UI entrances, text pop-ups, and element reveals, you MUST use this exact curve:
\`const snappy = Easing.bezier(0.075, 0.82, 0.165, 1);\`
*Behavior: It whips onto the screen instantly, then crawls to its final resting place.*

### 2. Parallax Background Push
To simulate a 3D camera, the background must ALWAYS be slowly scaling up throughout the scene:
\`const bgScale = interpolate(frame, [0, sequenceDuration], [1, 1.15]);\`

### 3. Masked Text Reveals (Sliding out of nowhere)
To reveal text dynamically, wrap the text in a mask container:
\`\`\`tsx
<div style={{ overflow: 'hidden', display: 'inline-block' }}>
  <div style={{ transform: \`translateY(\${interpolate(frame, [0, 15], [100, 0], { easing: snappy })})%\` }}>
    TEXT HERE
  </div>
</div>
\`\`\`

---

## 🎨 SECTION 2: VISUAL ENGINEERING BLUEPRINTS (COPY THESE CSS PATTERNS)

### Blueprint A: Glassmorphism UI Panels (Use for Callouts/Overlays)
When the strategy calls for an overlay, create a "macOS style" glass panel:
\`\`\`tsx
style={{
  backgroundColor: 'rgba(255, 255, 255, 0.03)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  boxShadow: '0 30px 60px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
  borderRadius: '24px',
  padding: '40px',
}}
\`\`\`
*Always add 3 small colored circles (red, yellow, green) to the top left of these panels to mimic a computer window.*

### Blueprint B: Kinetic "Stomp" Typography
Text must be visually aggressive and treated as art:
\`\`\`tsx
style={{
  fontSize: '110px',
  fontWeight: 900,
  textTransform: 'uppercase',
  lineHeight: 0.85,
  letterSpacing: '-0.04em',
  margin: 0,
  // For hollow text, add:
  color: 'transparent',
  WebkitTextStroke: '3px #FFFFFF' // or #00FF66 for neon
}}
\`\`\`

### Blueprint C: Procedural HUD & Grids
The background should never be solid. Implement this CSS grid on the root \`AbsoluteFill\`:
\`\`\`tsx
style={{
  backgroundImage: \`
    linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)\`,
  backgroundSize: '60px 60px',
  backgroundPosition: 'center center'
}}
\`\`\`
*Always add 1px absolute-positioned crosshairs (+) to the corners.*

### Blueprint D: The "Split Reveal" (For Surreal Style)
If utilizing "Style 2", create a component with two halves that pull apart:
\`\`\`tsx
// Left Half
<div style={{ position: 'absolute', left: 0, width: '50%', overflow: 'hidden', transform: \`translateX(-\${splitProgress}px)\` }}>
   <div style={{ width: '200vw' }}>IMAGE CONTENT</div>
</div>
// Right Half
<div style={{ position: 'absolute', right: 0, width: '50%', overflow: 'hidden', transform: \`translateX(\${splitProgress}px)\` }}>
   <div style={{ width: '200vw', transform: 'translateX(-50%)' }}>IMAGE CONTENT</div>
</div>
\`\`\`

---

## 🎬 SECTION 3: SCENE COMPOSITION & SEQUENCING

You must map the provided \`EngagementStrategy\` to the Remotion timeline using \`<Sequence>\` components.

1. **The Hook (0-3s):** 
   - Render massive kinetic typography.
   - Flash the screen (opacity 0 to 1 over 3 frames) at frame 0.
2. **Motion Graphics Arrays:**
   - Loop through the \`strategy.motionGraphics\` array.
   - Use \`<Sequence from={startFrame} durationInFrames={duration}>\`.
   - Apply *Blueprint A (Glassmorphism)* or *Blueprint B (Typography)* based on the graphic type (callout vs overlay).
3. **Layer Hierarchy:**
   - Z-Index 1: Background & HUD Grids.
   - Z-Index 2: Helper graphics (crosshairs, data numbers).
   - Z-Index 3: Callouts and Glass panels.
   - Z-Index 4: Kinetic Typography (Highest level).

---

## 🛠 SECTION 4: STRICT TSX ARCHITECTURE

### 4.1 DEFAULT_PROPS (MANDATORY — for runtime editing)

Every component MUST define a DEFAULT_PROPS object at the top. This enables the visual property editor to detect and modify values at runtime.

\`\`\`tsx
// =============================================================================
// COMPOSITION CONFIG
// =============================================================================
export const compositionConfig = {
  id: 'ViralVideo',
  durationInSeconds: 15,
  fps: 30,
  width: 1080,
  height: 1920,
};

// =============================================================================
// DEFAULT PROPS — ALL EDITABLE VALUES MUST BE HERE
// =============================================================================
const DEFAULT_PROPS = {
  hookText: 'Watch This!',
  ctaText: 'Follow for more',
  primaryColor: '#FF00FF',
  secondaryColor: '#00FFFF',
  accentColor: '#FFFF00',
  backgroundColor: '#0A0A0F',
  textColor: '#FFFFFF',
  headlineFontSize: 96,
  subheadlineFontSize: 42,
  animationSpeed: 1,
  hookStartX: '50%',
  hookStartY: '35%',
  ctaPositionY: '85%',
  transitionDuration: 30,
  showGridBackground: true,
  showCrosshairs: true,
} as const;
\`\`\`

The component then reads these values:
\`\`\`tsx
const ViralVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Destructure for easy access
  const {
    hookText, ctaText, primaryColor, secondaryColor, accentColor,
    backgroundColor, textColor, headlineFontSize, subheadlineFontSize,
    animationSpeed, hookStartX, hookStartY, ctaPositionY,
    transitionDuration, showGridBackground, showCrosshairs,
  } = DEFAULT_PROPS;

  // Use these values throughout the component for colors, text, sizes, positions
  return (
    <AbsoluteFill style={{ backgroundColor }}>
      {/* Use hookText, primaryColor, headlineFontSize, etc. */}
    </AbsoluteFill>
  );
};
\`\`\`

### 4.2 RULES FOR DEFAULT_PROPS
1. **Every color** used in the component MUST be a named prop (primaryColor, secondaryColor, etc.)
2. **Every text string** MUST be a prop (hookText, ctaText, etc.)
3. **Every size/number** MUST be a prop (fontSize, position values, timing)
4. Use descriptive camelCase names: hookText, not text1
5. Use \`as const\` for type inference
6. Place DEFAULT_PROPS right after compositionConfig, before helper components

### 4.3 FULL COMPONENT STRUCTURE

\`\`\`tsx
import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  Easing,
  useCurrentFrame,
  useVideoConfig,
  spring,
  random,
} from 'remotion';

// =============================================================================
// COMPOSITION CONFIG (MUST BE NAMED EXPORT)
// =============================================================================
export const compositionConfig = { ... };

// =============================================================================
// DEFAULT PROPS — ALL EDITABLE VALUES (MUST BE const + as const)
// =============================================================================
const DEFAULT_PROPS = { ... } as const;

// =============================================================================
// HELPER COMPONENTS (const + React.FC, NOT exported)
// =============================================================================
const GlassPanel: React.FC<{ ... }> = ({ ... }) => { ... };

// =============================================================================
// MAIN COMPONENT (MUST BE const + React.FC, NOT arrow shorthand)
// =============================================================================
const ViralVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const { hookText, primaryColor, backgroundColor, headlineFontSize } = DEFAULT_PROPS;

  return (
    <AbsoluteFill style={{ backgroundColor }}>
      {/* Use the destructured props */}
    </AbsoluteFill>
  );
};

// =============================================================================
// DEFAULT EXPORT (MANDATORY)
// =============================================================================
export default ViralVideo;
\`\`\`

---

## OUTPUT INSTRUCTIONS
Generate ONLY the raw, perfectly formatted TSX code. Do not include markdown formatting like \`\`\`tsx. Do not explain your code. Just output the code string.
`;

export async function generateRemotionCode(
  analysis: VideoAnalysis,
  strategy: EngagementStrategy,
  images?: File[],
): Promise<RemotionOutput> {
  // Build user content with optional images
  let userContent: string | Array<
    | { type: 'text'; text: string }
    | { type: 'image'; image: Buffer }
  > = `Generate a complete Remotion TSX video with motion graphics overlays for this video optimization strategy.

VIDEO ANALYSIS:
${JSON.stringify(analysis, null, 2)}

ENGAGEMENT STRATEGY:
${JSON.stringify(strategy, null, 2)}

Requirements:
- Use vertical format (1080x1920) for TikTok/Reels
- Include all hook text, lower thirds, transitions, and motion graphics from the strategy
- Use the Neon/Cyberpunk style for a viral look
- Make it 15 seconds duration at 30fps
- Include helper components for reusable elements (counters, callouts, etc.)
- Use frame-based animations with interpolate() and useCurrentFrame()
- Add smooth entrance/exit animations for each element
- Return the complete TSX in tsxCode and the compositionConfig object`;

  if (images && images.length > 0) {
    const parts: Array<{ type: 'text'; text: string } | { type: 'image'; image: Buffer }> = [
      { type: 'text', text: userContent as string },
    ];
    for (const img of images) {
      parts.push({
        type: 'image',
        image: Buffer.from(await img.arrayBuffer()),
      });
    }
    userContent = parts;
  }

  const { output } = await generateText({
    model: AI_MODELS.codeGen,
    output: Output.object({ schema: RemotionComponentSchema }),
    messages: [
      {
        role: 'system',
        content: SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: userContent,
      },
    ],
  });

  return output;
}

// ── Generate Remotion Code from Text Prompt + Optional Images ──
const PROMPT_SYSTEM = `You are an expert Remotion TSX video creator. A user has described what they want, and you must generate the complete Remotion TSX code for it.

The user may also provide reference images — use them to match the style, colors, mood, and content.

═══════════════════════════════════════════════════════
  MANDATORY CODE STRUCTURE (NO EXCEPTIONS)
═══════════════════════════════════════════════════════

Your output MUST follow this exact structure:

\`\`\`tsx
import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, spring, Easing } from 'remotion';

export const compositionConfig = {
  id: 'MyVideo',
  durationInSeconds: 15,
  fps: 30,
  width: 1080,
  height: 1920,
};

const DEFAULT_PROPS = {
  primaryColor: '#FF00FF',
  secondaryColor: '#00FFFF',
  backgroundColor: '#0A0A0F',
  headlineText: 'My Video',
  fontSize: 96,
  animationSpeed: 1,
} as const;

const MyVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { primaryColor, backgroundColor, headlineText, fontSize } = DEFAULT_PROPS;

  const opacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ backgroundColor }}>
      {/* content here */}
    </AbsoluteFill>
  );
};

export default MyVideo;
\`\`\`

═══════════════════════════════════════════════════════
  STRICT RULES
═══════════════════════════════════════════════════════

STRUCTURE:
- MUST have \`export const compositionConfig\` with id, durationInSeconds, fps, width, height
- MUST have \`const DEFAULT_PROPS = { ... } as const;\` with ALL editable values
- MUST use \`const ComponentName: React.FC = () => {}\` (NOT function, NOT arrow shorthand)
- MUST end with \`export default ComponentName;\`
- NO other exports allowed

IMAGES:
- The user may attach reference images for style/color/mood guidance ONLY
- DO NOT try to embed these images in the code — they are reference only, no URLs available
- NEVER use external image URLs (e.g. Wikimedia, Unsplash, stock photos) — they fail to load
- NEVER use \`staticFile()\` — files don't exist on the server
- NEVER use \`<img>\` HTML tags — they won't render in Remotion's canvas
- Instead use: solid color divs, CSS gradients, geometric shapes, borders, and typography as visual elements
- Match the style, colors, and mood of reference images using code-based elements (colors, gradients, shapes, text)

FORBIDDEN (WILL BREAK RENDERING):
- NO \`<img>\` tags — use \`<Img>\` from remotion
- NO \`staticFile()\` — use direct URLs
- NO \`mixBlendMode\` — not supported
- NO \`filter\` (e.g. grayscale, blur) — not supported
- NO \`backdropFilter\` — not supported
- NO \`clipPath\` — not supported
- NO \`zIndex\` — order elements in JSX instead
- NO CSS \`@keyframes\`, \`animation\`, or \`transition\`
- NO \`useState\`, \`useEffect\`, \`setTimeout\`

ANIMATIONS:
- ALL animations MUST use \`interpolate()\` with \`useCurrentFrame()\`
- ALWAYS include \`extrapolateLeft: 'clamp', extrapolateRight: 'clamp'\`
- Use \`spring()\` for natural motion
- Use \`Easing.bezier(0.33, 1, 0.68, 1)\` for smooth easing

DESIGN:
- Use vertical format (1080x1920) unless specified otherwise
- Use the Neon/Cyberpunk style by default (dark background, neon colors, HUD grid)
- Make it visually stunning — massive typography, glassmorphism panels, HUD grids
- If description is vague, be creative and make it look viral

OUTPUT: Return ONLY the TSX code. No markdown wrapping, no explanations.`;

export async function generateRemotionFromPrompt(
  prompt: string,
  images?: File[],
): Promise<RemotionOutput> {
  // Build user content: text + optional images
  const userContent: Array<
    | { type: 'text'; text: string }
    | { type: 'image'; image: Buffer; mimeType?: string }
  > = [{ type: 'text', text: prompt }];

  // Add images if provided
  if (images && images.length > 0) {
    for (const img of images) {
      const buffer = Buffer.from(await img.arrayBuffer());
      userContent.push({
        type: 'image',
        image: buffer,
        mimeType: img.type || 'image/png',
      });
    }
  }

  const { output } = await generateText({
    model: AI_MODELS.codeGen,
    output: Output.object({ schema: RemotionComponentSchema }),
    messages: [
      {
        role: 'system',
        content: PROMPT_SYSTEM,
      },
      {
        role: 'user',
        content: userContent,
      },
    ],
  });

  // Post-process: strip out any external image URLs and replace with colored divs
  // This prevents the AI from hallucinating Wikimedia/Unsplash URLs
  let cleanedCode = output.tsxCode;

  // Remove any <Img src="http..."/> or <img src="http..."/> tags
  cleanedCode = cleanedCode.replace(
    /<Img\s+[^>]*src\s*=\s*["'](https?:\/\/[^"']*?)["'][^>]*\/>/gi,
    '<div style={{ width: 200, height: 200, backgroundColor: "#333", borderRadius: 12 }} />'
  );

  // Remove any <img src="http..."/> HTML tags
  cleanedCode = cleanedCode.replace(
    /<img\s+[^>]*src\s*=\s*["'](https?:\/\/[^"']*?)["'][^>]*\/?>/gi,
    '<div style={{ width: 200, height: 200, backgroundColor: "#333", borderRadius: 12 }} />'
  );

  // Remove staticFile() calls
  cleanedCode = cleanedCode.replace(
    /staticFile\(["'][^"']*?["']\)/g,
    '""'
  );

  // Remove filter, mixBlendMode, backdropFilter, clipPath CSS properties
  cleanedCode = cleanedCode.replace(
    /\b(filter|mixBlendMode|backdropFilter|clipPath)\s*:\s*[^,}]+[,}]?/gi,
    ''
  );

  // Remove any remaining URLs in src attributes
  cleanedCode = cleanedCode.replace(
    /src\s*=\s*["']https?:\/\/[^"']*?["']/gi,
    ''
  );

  return { ...output, tsxCode: cleanedCode };
}