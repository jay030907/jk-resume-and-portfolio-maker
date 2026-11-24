import { NextRequest, NextResponse } from 'next/server';
import { isSafeHandle } from '@/lib/validation';

export async function POST(req: NextRequest) {
  let body: { username?: string } = {};
  try {
    body = (await req.json()) as { username?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
  }

  const username = String(body?.username || '').trim();
  if (!isSafeHandle(username) || username.includes('..')) {
    return NextResponse.json({ error: 'Invalid LeetCode username format.' }, { status: 400 });
  }

  try {
    const query = `
      query getUserProfile($username: String!) {
        matchedUser(username: $username) {
          username
          profile {
            ranking
          }
          submitStatsGlobal {
            acSubmissionNum {
              difficulty
              count
            }
          }
        }
      }
    `;
    const lcRes = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'FolioForge-Builder',
      },
      body: JSON.stringify({ query, variables: { username } }),
    });

    if (!lcRes.ok) {
      return NextResponse.json(
        {
          error:
            'LeetCode profile service did not respond. You can enter your solved count manually.',
        },
        { status: 502 }
      );
    }

    const payload = (await lcRes.json()) as {
      data?: {
        matchedUser?: {
          username?: string;
          profile?: { ranking?: number };
          submitStatsGlobal?: { acSubmissionNum?: Array<{ difficulty: string; count: number }> };
        };
      };
    };

    const user = payload.data?.matchedUser;
    if (!user) {
      return NextResponse.json(
        { error: `LeetCode user "${username}" not found.` },
        { status: 404 }
      );
    }

    const stats = user.submitStatsGlobal?.acSubmissionNum || [];
    const all = stats.find((s) => s.difficulty === 'All')?.count ?? 0;
    const medium = stats.find((s) => s.difficulty === 'Medium')?.count ?? 0;
    const hard = stats.find((s) => s.difficulty === 'Hard')?.count ?? 0;

    return NextResponse.json({
      username: user.username || username,
      totalSolved: all,
      mediumSolved: medium,
      hardSolved: hard,
      ranking: user.profile?.ranking || null,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'LeetCode lookup failed.' },
      { status: 500 }
    );
  }
}
