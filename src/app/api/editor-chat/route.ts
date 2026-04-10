import { NextRequest } from 'next/server';
import { streamText, tool, convertToModelMessages, stepCountIs, UIMessage } from 'ai';
import { z } from 'zod';
import { AI_MODELS } from '@/lib/ai-config';
import { chatRateLimiter, getClientIp } from '@/lib/rate-limiter';

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  // Rate limiting check
  const clientIp = getClientIp(req.headers);
  const rateLimit = chatRateLimiter.check(clientIp);
  
  if (!rateLimit.allowed) {
    const retryAfter = Math.max(1, Math.ceil((rateLimit.resetTime - Date.now()) / 1000));
    return new Response(
      JSON.stringify({ 
        error: 'Rate limit exceeded. Please try again later.', 
        retryAfter,
      }),
      {
        status: 429,
        headers: { 
          'Content-Type': 'application/json',
          'X-RateLimit-Reset': String(rateLimit.resetTime),
          'Retry-After': String(retryAfter),
        },
      }
    );
  }

  try {
    const { messages }: { messages: UIMessage[] } = await req.json();

    if (!messages?.length) {
      return new Response(JSON.stringify({ error: 'Messages are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = streamText({
      model: AI_MODELS.codeGen,
      messages: await convertToModelMessages(messages),
      stopWhen: stepCountIs(5), // Reduced from 10 to prevent excessive token usage
      system: `You are an expert Remotion TSX video editor assistant. The user has generated motion graphics code for their video, and they want to modify it using natural language.

YOUR CAPABILITIES:
- You can modify the generated Remotion TSX code based on user requests
- Changes can include: text content, colors, positions, timing, animations, layout, style
- You must return the COMPLETE modified TSX code using the modifyCode tool
- The code must remain fully functional — do not break imports, exports, or component structure
- Always explain what you changed and why

RULES FOR CODE MODIFICATION:
1. The tsxCode you return must be complete and valid — ready to be saved as a .tsx file
2. Preserve the component structure (compositionConfig export, default export)
3. Keep all Remotion imports (AbsoluteFill, Sequence, interpolate, etc.)
4. Maintain the visual style theme (colors, fonts, animations)
5. If the user asks for something impossible, explain why and suggest an alternative
6. Do NOT wrap the code in markdown code blocks — return raw TSX string
7. Import React and all needed React hooks explicitly
8. Only import from 'remotion' and 'react' — no external packages`,
      tools: {
        modifyCode: tool({
          description: 'Modify the Remotion TSX video component code based on user instructions. Returns the complete modified TSX code.',
          inputSchema: z.object({
            explanation: z.string().describe('Brief explanation of what was changed and why'),
            tsxCode: z.string().describe('The complete modified TSX code. Must be a valid, self-contained TSX file that can be compiled and rendered by Remotion.'),
          }),
          execute: async ({ explanation, tsxCode }) => {
            return { explanation, tsxCode, success: true };
          },
        }),
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Chat failed';
    console.error('[Editor Chat Error]', error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
