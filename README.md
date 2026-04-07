# ViralCut

ViralCut is a prototype AI-powered short-form video editor built with Next.js, Remotion, and Google Gemini. It analyzes an input video, generates a high-retention engagement strategy, and creates live Remotion TSX motion graphics so you can preview an AI-generated social media edit instantly.

## Features

- AI-driven video analysis for social media engagement and pacing
- Strategy generation for hooks, retention fixes, motion graphics, and sound cues
- Automatic Remotion TSX code generation using a structured AI workflow
- Live in-browser preview via `@remotion/player`
- Support for public video URLs and drag-and-drop local uploads
- Pipeline progress UI with step-by-step status tracking
- Built with Next.js App Router, Zustand state management, and TypeScript

## How it works

1. Upload a video or paste a public MP4/video URL.
2. The app sends the video to `/api/pipeline`.
3. The pipeline runs three AI stages:
   - `video-analyzer` analyzes shots, pacing, audio, and engagement gaps.
   - `engagement-strategist` generates a creative direction and retention strategy.
   - `remotion-codegen` outputs Remotion TSX code for an animated social media edit.
4. The generated TSX is compiled in-browser and previewed using Remotion Player.

> Note: The `/api/render` endpoint currently returns a placeholder response. Server-side MP4 rendering is not implemented in this MVP.

## Tech stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Remotion 4
- Zustand
- Google Gemini via `@ai-sdk/google`
- `ai` package for structured model output
- `sucrase` for runtime TSX compilation

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file in the project root and add your Google AI key:

```env
GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here
```

3. Run the development server:

```bash
npm run dev
```

4. Open the app in your browser:

```text
http://localhost:3000
```

## Project structure

- `src/app/` — Next.js UI and API routes
- `src/agents/` — AI pipeline modules for analysis, strategy, and Remotion codegen
- `src/hooks/` — custom hooks for runtime compilation and rendering
- `src/lib/` — AI provider configuration
- `src/stores/` — Zustand app state and pipeline management

## API routes

- `POST /api/pipeline` — full video AI pipeline (analysis, strategy, Remotion TSX generation)
- `POST /api/analyze` — standalone video analysis endpoint
- `POST /api/render` — placeholder endpoint for future MP4 rendering

## Scripts

- `npm run dev` — start the development server
- `npm run build` — build the production app
- `npm run start` — start the production server
- `npm run lint` — run ESLint

## Notes

- The app uses `generateText` from the `ai` package to call Google Gemini models defined in `src/lib/ai-config.ts`.
- The Remotion TSX code is compiled at runtime using `sucrase` and rendered inside the browser.
- For best results, use short social media clips and public video URLs or local MP4 uploads.

## License

This repository has no license defined.
  
