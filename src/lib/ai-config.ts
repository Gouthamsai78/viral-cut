import { createGoogleGenerativeAI } from '@ai-sdk/google';

/**
 * AI Provider Configuration
 * Centralized model selection and provider setup as per ai-sdk and gemini-api-dev skills.
 * 
 * Using gemini-3.1-flash-lite-preview for free tier - cost-efficient, fastest performance
 * for high-frequency, lightweight tasks (per Gemini API dev skill).
 */

export const googleProvider = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_AI_API_KEY,
});

// Recommended models from gemini-api-dev skill (free tier optimized)
export const AI_MODELS = {
  // Fast, multimodal, balanced performance (Default) - Free tier
  videoAnalysis: googleProvider('gemini-3.1-flash-lite-preview'),

  // High reasoning, complex research/coding - Free tier
  strategy: googleProvider('gemini-3.1-flash-lite-preview'),

  // Code generation (Remotion TSX) - Free tier
  codeGen: googleProvider('gemini-3.1-flash-lite-preview'),
} as const;

export type AiModelKey = keyof typeof AI_MODELS;
