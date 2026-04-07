# ViralCut

**AI-powered motion graphics engine** — Upload a video, describe what you want, or attach reference images. ViralCut generates production-ready Remotion motion graphics automatically.

## What it does

| Input | What happens | Output |
|-------|-------------|--------|
| **Video file** (drag & drop or upload) | AI analyzes scenes, pacing, and engagement → generates motion graphics overlay | Live preview + exportable MP4 |
| **Text prompt** (describe what you want) | AI creates motion graphics from scratch based on your description | Live preview + exportable MP4 |
| **Reference images** (attach or Ctrl+V paste) | AI matches style, colors, and mood from your images | Code-based visuals that match your aesthetic |

## Features

### 🎬 Dual Input Modes
- **Video Enhancement** — Upload a video file and AI generates motion graphics overlay (text, transitions, effects)
- **Prompt-to-Video** — Describe what you want in plain English and AI generates it from scratch

### 🖼️ Multimodal Input
- **Video files** — MP4, MOV, WEBM via drag & drop or file picker
- **Reference images** — PNG, JPG, WEBP via upload or Ctrl+V paste
- **Text prompts** — Describe style, content, colors, timing, animations

### 🤖 AI Editor
- **Chat** — Ask the AI to modify generated code naturally ("make the text bigger", "change to dark mode", "add a countdown")
- **Properties Panel** — Edit colors, text, sizes, positions, and timing with form controls and live preview

### 🎨 Visual Property Editor
- Automatic extraction of editable properties from generated code
- Color pickers, text inputs, sliders, and toggles
- One-click "Apply to Code" to bake changes into the TSX

### 📦 Client-Side MP4 Export
- Browser-based video rendering via `@remotion/web-renderer` (WebCodecs API)
- No server, no Lambda, no FFmpeg needed
- Real-time progress tracking during render

### 📊 Video Analysis (Video Mode)
- Scene-by-scene breakdown with visual elements and motion analysis
- Pacing metrics and engagement score
- Retention dropoff detection
- Audio profile analysis

### 🧠 AI Strategy (Video Mode)
- Hook text and motion style recommendations
- Retention fixes with timestamped actions
- Motion graphic placements (lower thirds, callouts, counters)
- Transition types, pacing edits, and SFX cues

## How it works

```
┌─────────────────────────────────────────────────────────┐
│                    VIRALCUT APP                          │
│                                                          │
│  ┌──────────────────┐     ┌──────────────────────────┐  │
│  │  Unified Input   │     │  Results                  │  │
│  │                  │     │  ┌─────────┬──────────┐  │  │
│  │  📹 Video File   │     │  │ Preview │ Analysis │  │  │
│  │  📝 Text Prompt  │     │  └─────────┴──────────┘  │  │
│  │  🖼️ Ref Images   │     │  ┌─────────┬──────────┐  │  │
│  │  Ctrl+V Paste    │     │  │ Editor  │ Code     │  │  │
│  └────────┬─────────┘     │  │ 💬 Chat │ 🎨 Props │  │  │
│           │               │  └─────────┴──────────┘  │  │
│           ▼               └──────────────────────────┘  │
│  ┌──────────────────────────┐                            │
│  │   AI Pipeline            │                            │
│  │                          │                            │
│  │  Has Video? → Analyze → Strategize → Generate Code   │
│  │  No Video? → Generate Code from Prompt + Images      │
│  └──────────────────────────┘                            │
│                                                          │
│  ┌──────────────────────────┐                            │
│  │   Client-Side Render     │                            │
│  │   Remotion Player (preview)                          │
│  │   WebCodecs → MP4 export                              │
│  └──────────────────────────┘                            │
└─────────────────────────────────────────────────────────┘
```

### Pipeline Flow

**Video Mode:**
1. User uploads a video file
2. `/api/pipeline` sends video to Google Gemini for analysis
3. AI generates engagement strategy based on analysis
4. AI generates Remotion TSX motion graphics code
5. Code is compiled in-browser via Sucrase
6. `<Player>` renders the preview
7. User exports MP4 via `@remotion/web-renderer`

**Prompt Mode:**
1. User describes what they want + optionally attaches reference images
2. `/api/generate-from-prompt` sends prompt + images to Google Gemini
3. AI generates Remotion TSX code based on description + visual style from images
4. Code is compiled in-browser and rendered in the Player
5. User exports MP4 via client-side rendering

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript (strict mode) |
| **Styling** | Tailwind CSS v4 |
| **State** | Zustand |
| **AI SDK** | Vercel AI SDK v6 (`ai`) |
| **AI Provider** | Google Gemini (`gemini-3.1-flash-lite-preview`, free tier) |
| **Video Engine** | Remotion 4.x |
| **Preview** | `@remotion/player` + runtime TSX compilation (Sucrase) |
| **Export** | `@remotion/web-renderer` (WebCodecs, client-side MP4) |
| **Chat** | `@ai-sdk/react` (`useChat` hook with streaming) |
| **Validation** | Zod v4 (structured AI output) |
| **Animations** | Framer Motion |
| **Icons** | Lucide React |

## Setup

### Prerequisites
- Node.js 20+
- A Google Generative AI API key ([get one free](https://aistudio.google.com/apikey))

### Installation

```bash
# Clone and install
git clone https://github.com/Gouthamsai78/viral-cut
cd viralcut
npm install
```

### Environment Variables

Create a `.env.local` file:

```env
GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build

```bash
npm run build
npm run start
```

### Lint

```bash
npm run lint
```

## Project Structure

```
src/
├── agents/                    # AI agent modules
│   ├── video-analyzer.ts      # Analyzes video content via Gemini
│   ├── engagement-strategist.ts  # Generates retention/hook strategies
│   ├── remotion-codegen.ts    # Generates Remotion TSX code (video mode)
│   └── schemas.ts             # Zod validation schemas for AI outputs
├── app/                       # Next.js App Router
│   ├── api/
│   │   ├── analyze/           # Standalone video analysis
│   │   ├── pipeline/          # Full video pipeline (analyze → strategize → code)
│   │   ├── editor-chat/       # Streaming chat for AI code editor
│   │   ├── render/            # Server-side render (stub)
│   │   └── generate-from-prompt/  # Prompt-to-video generation
│   ├── layout.tsx
│   └── page.tsx               # Main UI (client component)
├── components/                # React components
│   ├── chat-editor.tsx        # AI chat interface for code modification
│   └── property-editor.tsx    # Visual property editor panel
├── hooks/
│   ├── use-compilation.ts     # Runtime TSX compilation via Sucrase
│   ├── use-client-render.ts   # Client-side MP4 rendering via WebCodecs
│   └── extract-props.ts       # Property extraction from TSX source
├── lib/
│   ├── ai-config.ts           # AI provider configuration (Google Gemini)
│   └── utils.ts               # Tailwind class merging utility
└── stores/
    └── app-store.ts           # Zustand global state management
```

## API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/pipeline` | POST | Full video pipeline. Accepts FormData with `videoFile`, `images`, `prompt`. Returns `{ analysis, strategy, remotionOutput }` |
| `/api/generate-from-prompt` | POST | Prompt-to-video. Accepts FormData with `prompt`, `images`. Returns `{ remotionOutput }` |
| `/api/analyze` | POST | Standalone video analysis. Returns `VideoAnalysis` |
| `/api/editor-chat` | POST | Streaming chat endpoint for AI code editor. Uses `streamText` with `modifyCode` tool. Returns SSE stream |
| `/api/render` | POST | Server-side MP4 render (stub — returns 501) |

## AI Pipeline

### Agents

1. **Video Analyzer** (`video-analyzer.ts`) — Analyzes uploaded video for scene breakdown, pacing, engagement, and audio profile
2. **Engagement Strategist** (`engagement-strategist.ts`) — Generates hook strategies, retention fixes, motion graphic placements, and SFX cues
3. **Code Generator** (`remotion-codegen.ts`) — Produces complete Remotion TSX code with `DEFAULT_PROPS` for runtime editing
4. **Code Editor Agent** (`editor-chat` route) — Multi-step tool calling for natural language code modification via chat

### Models

All agents use `gemini-3.1-flash-lite-preview` (free tier, Google Gemini) via `@ai-sdk/google`.

### Structured Output

All AI outputs are validated with Zod schemas (`src/agents/schemas.ts`):
- `VideoAnalysisSchema` — scene data, pacing scores, engagement profile
- `EngagementStrategySchema` — hooks, retention fixes, motion graphics, transitions, SFX
- `RemotionComponentSchema` — TSX code string + composition config

## Editor System

### Chat Editor
- Uses `useChat` from `@ai-sdk/react` with `DefaultChatTransport`
- Streams responses from `/api/editor-chat` via SSE
- `modifyCode` tool returns complete modified TSX
- Auto-applies code changes to the Player preview

### Property Editor
- Extracts editable properties from TSX source via regex
- Categorizes properties: colors, text, numbers, positions, timing, booleans
- Updates via source code string replacement
- "Apply to Code" bakes changes into the TSX for export

### Runtime Compilation
- Uses Sucrase to transpile TSX → JS at runtime
- Custom `require()` shim maps `'remotion'` and `'react'` imports
- `new Function()` execution with CommonJS module system
- Extracts `Component` (default export) and `compositionConfig` (named export)

## Client-Side Rendering

### Preview
- `@remotion/player` renders the compiled Remotion component
- Updates reactively when `useCompilation` recompiles new code

### Export
- `@remotion/web-renderer` (`renderMediaOnWeb()`) encodes MP4 in the browser
- Uses WebCodecs API via Mediabunny — no FFmpeg, no server
- Progress callbacks show frame count, estimated time, and completion %
- Browser support: Chrome 94+, Firefox 130+, Safari 26+

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Browser Support

| Feature | Chrome | Firefox | Safari |
|---------|--------|---------|--------|
| Preview (Player) | ✅ 94+ | ✅ 130+ | ✅ 26+ |
| MP4 Export (WebCodecs) | ✅ 94+ | ✅ 130+ | ✅ 26+ |
| Chat (useChat) | ✅ | ✅ | ✅ |

## Limitations

- **AI-generated code quality** — Complex layouts may need manual refinement via the Editor
- **External images** — The AI is instructed to avoid external image URLs; all visuals are code-based (colors, gradients, shapes, typography)
- **Server-side rendering** — `/api/render` is a stub; all rendering is client-side
- **Remotion canvas rendering** — A subset of CSS properties is supported (no `mixBlendMode`, `filter`, `backdropFilter`, `clipPath`, `zIndex`)

## License

Proprietary — All rights reserved.
