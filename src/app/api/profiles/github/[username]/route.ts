import { NextRequest, NextResponse } from 'next/server';
import { isSafeHandle } from '@/lib/validation';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ username: string }> }
) {
  const { username: rawUsername } = await context.params;
  const username = String(rawUsername || '').trim();
  if (!isSafeHandle(username) || username.includes('..')) {
    return NextResponse.json({ error: 'Invalid GitHub username format.' }, { status: 400 });
  }

  try {
    const headers = {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'FolioForge-Builder',
    };
    const [userRes, reposRes] = await Promise.all([
      fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, { headers }),
      fetch(
        `https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=100`,
        { headers }
      ),
    ]);

    if (!userRes.ok) {
      return NextResponse.json(
        {
          error:
            userRes.status === 404
              ? `GitHub user "${username}" not found.`
              : 'Could not fetch GitHub profile.',
        },
        { status: userRes.status }
      );
    }

    const userData = (await userRes.json()) as Record<string, unknown>;
    const reposRaw = reposRes.ok
      ? ((await reposRes.json()) as Array<Record<string, unknown>>)
      : [];

    const repos = reposRaw
      .filter((r) => !r.fork)
      .map((r) => ({
        name: String(r.name || ''),
        description: String(r.description || ''),
        htmlUrl: String(r.html_url || ''),
        homepage: String(r.homepage || ''),
        language: String(r.language || ''),
        stars: Number(r.stargazers_count || 0),
        forks: Number(r.forks_count || 0),
        topics: Array.isArray(r.topics) ? r.topics.map(String) : [],
      }));

    return NextResponse.json({
      username: String(userData.login || username),
      name: String(userData.name || ''),
      bio: String(userData.bio || ''),
      avatarUrl: String(userData.avatar_url || ''),
      publicRepos: Number(userData.public_repos || 0),
      followers: Number(userData.followers || 0),
      location: String(userData.location || ''),
      blog: String(userData.blog || ''),
      repos,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'GitHub lookup failed.' },
      { status: 500 }
    );
  }
}
