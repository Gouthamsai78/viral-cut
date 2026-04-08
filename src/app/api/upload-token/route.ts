import { NextRequest, NextResponse } from 'next/server';
import { generateClientTokenFromReadWriteToken } from '@vercel/blob/client';

export async function POST(req: NextRequest) {
  try {
    const { pathname, multipart } = await req.json();

    if (!pathname) {
      return NextResponse.json({ error: 'pathname is required' }, { status: 400 });
    }

    // Generate a client upload token
    const token = await generateClientTokenFromReadWriteToken({
      pathname,
      maximumSizeInBytes: 500 * 1024 * 1024, // 500MB
    });

    return NextResponse.json({ token });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate upload token';
    console.error('[Upload Token Error]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
