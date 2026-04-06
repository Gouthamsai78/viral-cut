import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // Server-side rendering is disabled in the current MVP.
  // The CDN-based Remotion Player handles client-side preview.
  // A future iteration will use a dedicated render worker (e.g., Render Farm API or Lambda).
  return NextResponse.json(
    { error: 'Server-side MP4 rendering is not yet available. Use the in-browser preview.' },
    { status: 501 },
  );
}
