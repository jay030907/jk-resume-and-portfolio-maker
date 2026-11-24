import { NextRequest, NextResponse } from 'next/server';
import { isSafeHandle } from '@/lib/validation';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ handle: string }> }
) {
  const { handle: rawHandle } = await context.params;
  const handle = String(rawHandle || '').trim();
  if (!isSafeHandle(handle) || handle.includes('..')) {
    return NextResponse.json({ error: 'Invalid Codeforces handle format.' }, { status: 400 });
  }

  try {
    const cfRes = await fetch(
      `https://codeforces.com/api/user.info?handles=${encodeURIComponent(handle)}`
    );
    const cfData = (await cfRes.json()) as {
      status?: string;
      comment?: string;
      result?: Array<{ handle?: string; rating?: number; maxRating?: number; rank?: string }>;
    };

    if (cfData.status !== 'OK' || !cfData.result?.[0]) {
      return NextResponse.json(
        { error: cfData.comment || `Codeforces user "${handle}" not found.` },
        { status: 404 }
      );
    }

    const info = cfData.result[0];
    return NextResponse.json({
      handle: info.handle || handle,
      rating: info.rating || 0,
      maxRating: info.maxRating || 0,
      rank: info.rank || 'Unrated',
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Codeforces lookup failed.' },
      { status: 500 }
    );
  }
}
