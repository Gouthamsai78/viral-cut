# ViralCut - AI-Powered Video Editor

## Project Overview

**ViralCut** is an AI-powered SaaS video editing application designed to optimize videos for social media engagement. Built with Next.js, it analyzes uploaded videos and automatically generates engagement-optimized motion graphics using Remotion.

### Core Features

1. **Video Analyzer** - AI breaks down video into scenes, analyzing pacing, engagement metrics, audio profile, and motion patterns
2. **Engagement Strategist** - Generates retention fixes, hook strategies, motion graphic placements, and SFX cues
3. **Remotion Code Generator** - Creates production-ready TSX motion graphics components (text overlays, transitions, lower thirds, etc.)
4. **Live Preview** - Real-time video preview using `@remotion/player` with Babel transpilation
5. **Video Export** - Server-side MP4 rendering via Remotion bundler

### Architecture

```
src/
├── agents/              # AI agent modules
│   ├── video-analyzer.ts      # Analyzes video content via Gemini AI
│   ├── engagement-strategist.ts # Generates retention/hook strategies
│   ├── remotion-codegen.ts    # Generates Remotion TSX code
│   └── schemas.ts             # Zod validation schemas
├── app/                 # Next.js App Router
│   ├── api/
│   │   ├── analyze/     # Video analysis endpoint
│   │   ├── pipeline/    # Full AI pipeline endpoint
│   │   └── render/      # Server-side MP4 rendering
│   ├── layout.tsx
│   └── page.tsx         # Main UI (client component)
├── hooks/
│   └── use-compilation.ts # Babel transpilation for Remotion preview
├── lib/
│   ├── ai-config.ts     # AI provider configuration (Google Gemini)
│   └── utils.ts         # Tailwind class merging utility
└── stores/
    └── app-store.ts     # Zustand state management
```

## Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| State Management | Zustand |
| AI SDK | Vercel AI SDK (`ai`) |
| AI Provider | Google Gemini (`gemini-3.1-flash-lite-preview`) |
| Video Engine | Remotion 4.x |
| Animation | Framer Motion |
| Icons | Lucide React |
| Validation | Zod |
| Schema | Output validation via `Output.object()` |

## Getting Started

### Prerequisites

- Node.js 20+
- A Google Generative AI API key (for Gemini API access)

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
# Create a .env.local file with:
# GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here
# or
# GOOGLE_AI_API_KEY=your_api_key_here
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
```

### Lint

```bash
npm run lint
```

### Start Production

```bash
npm run start
```

## AI Pipeline Flow

1. **Input** - User provides a video via URL or file upload
2. **Video Analyzer** (`analyzeVideo`) - Gemini AI analyzes the video and returns a `VideoAnalysis` object with scene breakdowns, pacing scores, engagement profile, and audio profile
3. **Engagement Strategist** (`generateStrategy`) - Generates an `EngagementStrategy` with hook strategies, retention fixes, motion graphic placements, transitions, pacing edits, and SFX cues
4. **Remotion Code Gen** (`generateRemotionCode`) - Produces a `RemotionOutput` with complete TSX code for motion graphics and composition configuration
5. **Preview** - Client-side preview via `@remotion/player` with Babel transpilation
6. **Export** - Server-side MP4 rendering via `/api/render`

## Key Configuration

### AI Models (src/lib/ai-config.ts)

All three pipeline stages use `gemini-3.1-flash-lite-preview` (free tier optimized):
- `videoAnalysis` - Video analysis
- `strategy` - Engagement strategy generation
- `codeGen` - Remotion TSX code generation

### Remotion Output Format (vertical by default)

- Resolution: 1080x1920 (TikTok/Reels/Shorts)
- FPS: 30
- Duration: 15 seconds
- Style: Neon/Cyberpunk

## Development Conventions

- **Path aliases**: Use `@/` prefix for imports (maps to `src/`)
- **State management**: Zustand for global app state
- **Type safety**: Full TypeScript with strict mode; Zod schemas for AI outputs
- **Styling**: Tailwind CSS v4 with utility class merging (`cn()` utility)
- **Component structure**: Client components marked with `'use client'`
- **AI outputs**: Always validated with Zod schemas via Vercel AI SDK's `Output.object()`

## Environment Variables

| Variable | Description |
|----------|-------------|
| `GOOGLE_GENERATIVE_AI_API_KEY` | Google Gemini API key |
| `GOOGLE_AI_API_KEY` | Alternative name for Gemini API key |

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/pipeline` | POST | Runs the full AI pipeline (analyze → strategize → generate code). Accepts `FormData` with `videoUrl` or `videoFile`. Max duration: 120s |
| `/api/analyze` | POST | Video analysis only |
| `/api/render` | POST | Server-side MP4 rendering. Accepts JSON with `tsxCode` and `compositionConfig` |

## Pipeline Status States

- `idle` - No pipeline running
- `uploading` - Video upload in progress
- `analyzing` - AI analyzing video content
- `strategizing` - Generating engagement strategy
- `generating` - Creating Remotion TSX code
- `complete` - Pipeline finished successfully
- `error` - Pipeline failed
