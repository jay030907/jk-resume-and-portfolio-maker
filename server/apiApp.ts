import express, { Express, Request, Response } from 'express';
import { GoogleGenAI, Type } from '@google/genai';

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function mapGeminiError(err: unknown): { status: number; message: string } {
  const rawMessage = err instanceof Error ? err.message : String(err);
  let extracted = rawMessage;
  try {
    const parsed = JSON.parse(rawMessage) as { error?: { code?: number; message?: string; status?: string } };
    if (parsed?.error?.message) extracted = parsed.error.message;
  } catch {
    // Keep rawMessage
  }
  if (rawMessage.includes('PERMISSION_DENIED') || rawMessage.includes('403') || rawMessage.includes('API_KEY_INVALID')) {
    return {
      status: 403,
      message: 'Gemini API key is missing or invalid. Check your key in Settings > Secrets or Environment Variables.',
    };
  }
  if (rawMessage.includes('RESOURCE_EXHAUSTED') || rawMessage.includes('429')) {
    return {
      status: 429,
      message: 'Gemini API quota temporarily reached. Please retry in a moment.',
    };
  }
  if (rawMessage.includes('UNAVAILABLE') || rawMessage.includes('503') || rawMessage.includes('high demand')) {
    return {
      status: 503,
      message: 'AI service is experiencing a brief traffic spike. Please tap retry in a few seconds.',
    };
  }
  if (rawMessage.includes('NOT_FOUND') || rawMessage.includes('404')) {
    return {
      status: 502,
      message: 'Requested Gemini model was unavailable. Please try again.',
    };
  }
  return {
    status: 500,
    message: extracted || 'Failed to generate content with AI.',
  };
}

async function callGeminiWithRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      const isTransient =
        msg.includes('503') ||
        msg.includes('UNAVAILABLE') ||
        msg.includes('high demand') ||
        msg.includes('ECONNRESET') ||
        msg.includes('ETIMEDOUT');
      if (!isTransient || attempt === maxAttempts) {
        throw err;
      }
      const delayMs = 600 * Math.pow(2, attempt - 1);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw lastErr;
}

function isSafeHandle(value: string): boolean {
  return /^[a-zA-Z0-9._-]{1,45}$/.test(value);
}

function sanitizeExternalUrl(raw: unknown): string {
  const val = String(raw || '').trim();
  if (!val) return '';
  if (/^(https?:\/\/|mailto:)/i.test(val)) return val;
  if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/[^\s]*)?$/.test(val) && !val.includes(':')) {
    return `https://${val}`;
  }
  return '';
}

export function createApiApp(): Express {
  const app = express();
  app.use(express.json({ limit: '6mb' }));

  // Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true, hasGeminiKey: Boolean(process.env.GEMINI_API_KEY?.trim()) });
  });

  // 1. Live GitHub public profile & top repos sync (allowlisted api.github.com only)
  app.get('/api/profiles/github/:username', async (req: Request, res: Response) => {
    const username = String(req.params.username || '').trim();
    if (!isSafeHandle(username) || username.includes('..')) {
      res.status(400).json({ error: 'Invalid GitHub username format.' });
      return;
    }

    try {
      const headers = {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'FolioForge-Builder',
      };
      const [userRes, reposRes] = await Promise.all([
        fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, { headers }),
        fetch(`https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=8`, { headers }),
      ]);

      if (!userRes.ok) {
        res.status(userRes.status).json({
          error: userRes.status === 404 ? `GitHub user "${username}" not found.` : 'Could not fetch GitHub profile.',
        });
        return;
      }

      const userData = (await userRes.json()) as Record<string, unknown>;
      const reposRaw = reposRes.ok ? ((await reposRes.json()) as Array<Record<string, unknown>>) : [];

      const repos = reposRaw
        .filter((r) => !r.fork)
        .slice(0, 6)
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

      res.json({
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
      res.status(500).json({ error: err instanceof Error ? err.message : 'GitHub lookup failed.' });
    }
  });

  // 2. Live Codeforces public rating sync (allowlisted codeforces.com only)
  app.get('/api/profiles/codeforces/:handle', async (req: Request, res: Response) => {
    const handle = String(req.params.handle || '').trim();
    if (!isSafeHandle(handle) || handle.includes('..')) {
      res.status(400).json({ error: 'Invalid Codeforces handle format.' });
      return;
    }

    try {
      const cfRes = await fetch(`https://codeforces.com/api/user.info?handles=${encodeURIComponent(handle)}`);
      const cfData = (await cfRes.json()) as {
        status?: string;
        comment?: string;
        result?: Array<{ handle?: string; rating?: number; maxRating?: number; rank?: string }>;
      };

      if (cfData.status !== 'OK' || !cfData.result?.[0]) {
        res.status(404).json({ error: cfData.comment || `Codeforces user "${handle}" not found.` });
        return;
      }

      const info = cfData.result[0];
      res.json({
        handle: info.handle || handle,
        rating: info.rating || 0,
        maxRating: info.maxRating || 0,
        rank: info.rank || 'Unrated',
      });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Codeforces lookup failed.' });
    }
  });

  // 3. Live LeetCode public stats sync (allowlisted leetcode.com/graphql only)
  app.post('/api/profiles/leetcode', async (req: Request, res: Response) => {
    const username = String(req.body?.username || '').trim();
    if (!isSafeHandle(username) || username.includes('..')) {
      res.status(400).json({ error: 'Invalid LeetCode username format.' });
      return;
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
        res.status(502).json({ error: 'LeetCode profile service did not respond. You can enter your solved count manually.' });
        return;
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
        res.status(404).json({ error: `LeetCode user "${username}" not found.` });
        return;
      }

      const stats = user.submitStatsGlobal?.acSubmissionNum || [];
      const all = stats.find((s) => s.difficulty === 'All')?.count ?? 0;
      const medium = stats.find((s) => s.difficulty === 'Medium')?.count ?? 0;
      const hard = stats.find((s) => s.difficulty === 'Hard')?.count ?? 0;

      res.json({
        username: user.username || username,
        totalSolved: all,
        mediumSolved: medium,
        hardSolved: hard,
        ranking: user.profile?.ranking || null,
      });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'LeetCode lookup failed.' });
    }
  });

  // 4. AI Autopilot: Full Resume + Portfolio synthesis
  app.post('/api/ai/generate', async (req: Request, res: Response) => {
    const ai = getGeminiClient();
    if (!ai) {
      res.status(500).json({
        error: 'Gemini API key is not configured. Add GEMINI_API_KEY in Settings > Secrets or Environment Variables.',
      });
      return;
    }

    try {
      const { portfolioData, aiInput } = req.body as {
        portfolioData: Record<string, unknown>;
        aiInput: {
          rawNotes?: string;
          targetRole?: string;
          tone?: string;
          jobDescription?: string;
          includeCodingStats?: boolean;
        };
      };

      if (!portfolioData || typeof portfolioData !== 'object') {
        res.status(400).json({ error: 'Missing portfolio input payload.' });
        return;
      }

      const profileCopy = { ...((portfolioData.profile as Record<string, unknown>) || {}) };
      const hasPhoto = Boolean(profileCopy.photoDataUrl);
      delete profileCopy.photoDataUrl;

      const cleanContext = {
        profile: { ...profileCopy, hasProfilePhoto: hasPhoto },
        linkedAccounts: portfolioData.accounts || [],
        education: portfolioData.education || [],
        projects: portfolioData.projects || [],
        experience: portfolioData.experience || [],
        skills: portfolioData.skills || [],
        achievements: portfolioData.achievements || [],
      };

      const systemInstruction = `You are a senior technical career coach and portfolio copywriter helping beginners craft an authentic, ATS-ready resume and crisp personal portfolio website. Ground every claim strictly in the user's supplied facts, linked coding accounts, and raw notes.`;

      const prompt = `Transform and polish the following beginner developer's information into a complete resume and portfolio dataset.

Target Role: ${aiInput?.targetRole || 'Software Engineering Intern / Junior Developer'}
Writing Tone: ${aiInput?.tone || 'ATS Concise'}
Include Linked Coding Platform Highlights: ${aiInput?.includeCodingStats !== false ? 'Yes' : 'No'}
Target Job Description (if provided): ${aiInput?.jobDescription || 'None provided'}

Beginner's Raw Notes:
${aiInput?.rawNotes || 'Refine and elevate the structured profile fields and linked accounts below.'}

Structured User Profile & Linked Accounts:
${JSON.stringify(cleanContext, null, 2)}`;

      const response = await callGeminiWithRetry(() =>
        ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: prompt,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                headline: { type: Type.STRING },
                portfolioTagline: { type: Type.STRING },
                summary: { type: Type.STRING },
                availability: { type: Type.STRING },
                projects: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      role: { type: Type.STRING },
                      techStack: { type: Type.ARRAY, items: { type: Type.STRING } },
                      liveUrl: { type: Type.STRING },
                      repoUrl: { type: Type.STRING },
                      summary: { type: Type.STRING },
                      highlights: { type: Type.ARRAY, items: { type: Type.STRING } },
                    },
                    required: ['title', 'role', 'techStack', 'summary', 'highlights'],
                  },
                },
                experience: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      organization: { type: Type.STRING },
                      role: { type: Type.STRING },
                      type: { type: Type.STRING },
                      period: { type: Type.STRING },
                      location: { type: Type.STRING },
                      highlights: { type: Type.ARRAY, items: { type: Type.STRING } },
                    },
                    required: ['organization', 'role', 'type', 'period', 'highlights'],
                  },
                },
                education: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      institution: { type: Type.STRING },
                      degree: { type: Type.STRING },
                      field: { type: Type.STRING },
                      startYear: { type: Type.STRING },
                      endYear: { type: Type.STRING },
                      gpa: { type: Type.STRING },
                      coursework: { type: Type.STRING },
                    },
                    required: ['institution', 'degree'],
                  },
                },
                skills: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      category: { type: Type.STRING },
                      items: { type: Type.ARRAY, items: { type: Type.STRING } },
                    },
                    required: ['category', 'items'],
                  },
                },
                achievements: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      issuer: { type: Type.STRING },
                      date: { type: Type.STRING },
                      detail: { type: Type.STRING },
                    },
                    required: ['title', 'issuer', 'detail'],
                  },
                },
                accountStatSuggestions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      platform: { type: Type.STRING },
                      statText: { type: Type.STRING },
                    },
                    required: ['platform', 'statText'],
                  },
                },
              },
              required: ['headline', 'portfolioTagline', 'summary', 'projects', 'experience', 'skills', 'achievements'],
            },
          },
        })
      );

      const parsed = JSON.parse(response.text || '{}');
      res.json({ generated: parsed });
    } catch (err) {
      const mapped = mapGeminiError(err);
      res.status(mapped.status).json({ error: mapped.message });
    }
  });

  // 5. Autonomous Instruction-Driven AI Editor
  app.post('/api/ai/instruct', async (req: Request, res: Response) => {
    const ai = getGeminiClient();
    if (!ai) {
      res.status(500).json({
        error: 'Gemini API key is not configured. Add GEMINI_API_KEY in Settings > Secrets or Environment Variables.',
      });
      return;
    }

    try {
      const {
        instruction,
        portfolioData,
        uiPreferences,
        targetRole,
        tone,
        jobDescription,
        history,
      } = req.body as {
        instruction?: string;
        portfolioData?: Record<string, unknown>;
        uiPreferences?: {
          previewMode?: 'resume' | 'portfolio';
          resumeTemplate?: 'classic' | 'modern';
          portfolioTheme?: 'editorial' | 'monograph' | 'paper';
          showPhotoOnResume?: boolean;
          accentColor?: string;
        };
        targetRole?: string;
        tone?: string;
        jobDescription?: string;
        history?: Array<{ role: string; text: string }>;
      };

      const cleanInstruction = String(instruction || '').trim();
      if (!cleanInstruction) {
        res.status(400).json({ error: 'Please enter an instruction for AI Mode.' });
        return;
      }
      if (cleanInstruction.length > 6000) {
        res.status(400).json({ error: 'Instruction is too long. Please keep it under 6,000 characters.' });
        return;
      }
      if (!portfolioData || typeof portfolioData !== 'object') {
        res.status(400).json({ error: 'Missing workspace state.' });
        return;
      }

      const profileRaw = (portfolioData.profile as Record<string, unknown>) || {};
      const hasPhoto = Boolean(profileRaw.photoDataUrl);
      const { photoDataUrl: _dropPhoto, ...profileWithoutPhoto } = profileRaw;

      const rawProjects = Array.isArray(portfolioData.projects)
        ? (portfolioData.projects as Array<Record<string, unknown>>)
        : [];
      const projectsWithoutImages = rawProjects.map((p) => {
        const { coverImage: _dropCover, ...rest } = p;
        return rest;
      });

      const compactState = {
        profile: { ...profileWithoutPhoto, hasProfilePhoto: hasPhoto },
        accounts: Array.isArray(portfolioData.accounts) ? portfolioData.accounts : [],
        education: Array.isArray(portfolioData.education) ? portfolioData.education : [],
        projects: projectsWithoutImages,
        experience: Array.isArray(portfolioData.experience) ? portfolioData.experience : [],
        skills: Array.isArray(portfolioData.skills) ? portfolioData.skills : [],
        achievements: Array.isArray(portfolioData.achievements) ? portfolioData.achievements : [],
        customSections: Array.isArray(portfolioData.customSections) ? portfolioData.customSections : [],
      };

      const safeHistory = Array.isArray(history)
        ? history
            .slice(-6)
            .map((m) => `${m.role === 'user' ? 'User' : 'AI'}: ${String(m.text || '').slice(0, 400)}`)
            .join('\n')
        : '';

      const systemInstruction = `You are FolioForge's autonomous AI Resume & Portfolio Editor.
The user gives natural-language instructions to CREATE, ADD, CHANGE, REORDER, or REMOVE anything across both their ATS Resume and Personal Portfolio Website, including linked coding accounts (github, vercel, leetcode, hackerrank, codechef, codeforces, linkedin, kaggle, stackoverflow, hashnode, behance, x, website, custom), custom sections (languages spoken, volunteer work, publications, certifications, coursework, etc.), and presentation settings.

Strict Execution Rules:
1. Return the COMPLETE updated portfolioData and uiPreferences JSON objects reflecting the user's instruction.
2. PRESERVE ALL UNCHANGED DATA EXACTLY AS PROVIDED:
   - Keep existing item IDs ("id" field) on untouched or edited items so attached photos and cover images stay linked.
   - Generate clean new string IDs (e.g. "proj-101", "sec-lang-1") ONLY for newly added items.
   - Do NOT drop unrelated sections, projects, accounts, or customSections unless the user asked to remove or replace them, OR the user asked to build/create a brand-new profile from scratch.
3. ADDING: When asked to add a project, skill, experience, education, achievement, custom section, or linked account, insert it cleanly with ATS-ready action-verb bullets and auto-build valid https:// URLs when only a username is given.
4. CHANGING / POLISHING / ANSWERING: Update requested fields accurately. If the user asks a general advice question without requesting edits, keep portfolioData and uiPreferences unchanged, explain your advice in "reply", and set changesSummary to ["No changes applied — answered question"].
5. REMOVING: When asked to delete, remove, or hide a field, bullet, project, experience, skill, custom section, or account, remove it cleanly from the returned JSON.
6. UI & THEME CONTROL: Update "uiPreferences" ONLY if the user asks to switch views ("resume" or "portfolio"), change resume template ("classic" or "modern"), change portfolio theme ("editorial", "monograph", or "paper"), change accent color ("blue", "emerald", "rose", "amber", "slate"), or show/hide profile photo on resume ("showPhotoOnResume"). Otherwise keep the current uiPreferences values unchanged.
7. CHANGE LOG: Populate "changesSummary" with 1-6 crisp, plain-English bullets describing each exact addition, edit, or removal made.`;

      const prompt = `Current Target Role Context: ${targetRole || 'Software Engineering Intern'}
Preferred Tone: ${tone || 'ATS Concise'}
Optional Target Job Description: ${jobDescription || 'None'}

Current UI Preferences:
${JSON.stringify(
  uiPreferences || {
    previewMode: 'resume',
    resumeTemplate: 'classic',
    portfolioTheme: 'editorial',
    showPhotoOnResume: true,
    accentColor: 'blue',
  }
)}

Current Resume & Portfolio State:
${JSON.stringify(compactState, null, 2)}

${safeHistory ? `Recent Conversation:\n${safeHistory}\n` : ''}
User Instruction:
"${cleanInstruction}"`;

      const response = await callGeminiWithRetry(() =>
        ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: prompt,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                reply: { type: Type.STRING },
                changesSummary: { type: Type.ARRAY, items: { type: Type.STRING } },
                uiPreferences: {
                  type: Type.OBJECT,
                  properties: {
                    previewMode: { type: Type.STRING },
                    resumeTemplate: { type: Type.STRING },
                    portfolioTheme: { type: Type.STRING },
                    showPhotoOnResume: { type: Type.BOOLEAN },
                    accentColor: { type: Type.STRING },
                  },
                  required: ['previewMode', 'resumeTemplate', 'portfolioTheme', 'showPhotoOnResume', 'accentColor'],
                },
                portfolioData: {
                  type: Type.OBJECT,
                  properties: {
                    profile: {
                      type: Type.OBJECT,
                      properties: {
                        fullName: { type: Type.STRING },
                        headline: { type: Type.STRING },
                        portfolioTagline: { type: Type.STRING },
                        email: { type: Type.STRING },
                        phone: { type: Type.STRING },
                        location: { type: Type.STRING },
                        availability: { type: Type.STRING },
                        showPhotoOnResume: { type: Type.BOOLEAN },
                        summary: { type: Type.STRING },
                      },
                      required: ['fullName', 'headline', 'portfolioTagline', 'email', 'summary'],
                    },
                    accounts: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          platform: { type: Type.STRING },
                          label: { type: Type.STRING },
                          username: { type: Type.STRING },
                          url: { type: Type.STRING },
                          statText: { type: Type.STRING },
                          enabled: { type: Type.BOOLEAN },
                        },
                        required: ['id', 'platform', 'label', 'username', 'url', 'statText', 'enabled'],
                      },
                    },
                    education: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          institution: { type: Type.STRING },
                          degree: { type: Type.STRING },
                          field: { type: Type.STRING },
                          startYear: { type: Type.STRING },
                          endYear: { type: Type.STRING },
                          gpa: { type: Type.STRING },
                          coursework: { type: Type.STRING },
                        },
                        required: ['id', 'institution', 'degree'],
                      },
                    },
                    projects: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          title: { type: Type.STRING },
                          role: { type: Type.STRING },
                          techStack: { type: Type.ARRAY, items: { type: Type.STRING } },
                          liveUrl: { type: Type.STRING },
                          repoUrl: { type: Type.STRING },
                          summary: { type: Type.STRING },
                          highlights: { type: Type.ARRAY, items: { type: Type.STRING } },
                        },
                        required: ['id', 'title', 'role', 'techStack', 'summary', 'highlights'],
                      },
                    },
                    experience: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          organization: { type: Type.STRING },
                          role: { type: Type.STRING },
                          type: { type: Type.STRING },
                          period: { type: Type.STRING },
                          location: { type: Type.STRING },
                          highlights: { type: Type.ARRAY, items: { type: Type.STRING } },
                        },
                        required: ['id', 'organization', 'role', 'type', 'period', 'highlights'],
                      },
                    },
                    skills: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          category: { type: Type.STRING },
                          items: { type: Type.ARRAY, items: { type: Type.STRING } },
                        },
                        required: ['id', 'category', 'items'],
                      },
                    },
                    achievements: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          title: { type: Type.STRING },
                          issuer: { type: Type.STRING },
                          date: { type: Type.STRING },
                          detail: { type: Type.STRING },
                        },
                        required: ['id', 'title', 'issuer', 'detail'],
                      },
                    },
                    customSections: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          title: { type: Type.STRING },
                          entries: {
                            type: Type.ARRAY,
                            items: {
                              type: Type.OBJECT,
                              properties: {
                                heading: { type: Type.STRING },
                                subheading: { type: Type.STRING },
                                detail: { type: Type.STRING },
                              },
                              required: ['heading'],
                            },
                          },
                        },
                        required: ['id', 'title', 'entries'],
                      },
                    },
                  },
                  required: ['profile', 'accounts', 'education', 'projects', 'experience', 'skills', 'achievements'],
                },
              },
              required: ['reply', 'changesSummary', 'uiPreferences', 'portfolioData'],
            },
          },
        })
      );

      const parsed = JSON.parse(response.text || '{}') as {
        reply?: string;
        changesSummary?: string[];
        uiPreferences?: {
          previewMode?: string;
          resumeTemplate?: string;
          portfolioTheme?: string;
          showPhotoOnResume?: boolean;
          accentColor?: string;
        };
        portfolioData?: {
          profile?: Record<string, unknown>;
          accounts?: Array<Record<string, unknown>>;
          education?: Array<Record<string, unknown>>;
          projects?: Array<Record<string, unknown>>;
          experience?: Array<Record<string, unknown>>;
          skills?: Array<Record<string, unknown>>;
          achievements?: Array<Record<string, unknown>>;
          customSections?: Array<Record<string, unknown>>;
        };
      };

      const validPreview = parsed.uiPreferences?.previewMode === 'portfolio' ? 'portfolio' : 'resume';
      const validTemplate = parsed.uiPreferences?.resumeTemplate === 'modern' ? 'modern' : 'classic';
      const validTheme =
        parsed.uiPreferences?.portfolioTheme === 'monograph' || parsed.uiPreferences?.portfolioTheme === 'paper'
          ? parsed.uiPreferences.portfolioTheme
          : 'editorial';
      const allowedAccents = new Set(['blue', 'emerald', 'rose', 'amber', 'slate']);
      const validAccent = allowedAccents.has(String(parsed.uiPreferences?.accentColor || ''))
        ? String(parsed.uiPreferences?.accentColor)
        : 'blue';
      const showPhotoOnResume =
        typeof parsed.uiPreferences?.showPhotoOnResume === 'boolean'
          ? parsed.uiPreferences.showPhotoOnResume
          : Boolean(parsed.portfolioData?.profile?.showPhotoOnResume ?? true);

      const allowedPlatforms = new Set([
        'github',
        'vercel',
        'leetcode',
        'hackerrank',
        'codechef',
        'codeforces',
        'linkedin',
        'kaggle',
        'stackoverflow',
        'hashnode',
        'behance',
        'x',
        'website',
        'custom',
      ]);

      const sanitizedAccounts = (parsed.portfolioData?.accounts || []).map((acc, idx) => {
        const rawPlatform = String(acc.platform || 'custom').toLowerCase();
        return {
          id: String(acc.id || `acc-ai-${Date.now()}-${idx}`),
          platform: allowedPlatforms.has(rawPlatform) ? rawPlatform : 'custom',
          label: String(acc.label || 'Link'),
          username: String(acc.username || ''),
          url: sanitizeExternalUrl(acc.url),
          statText: String(acc.statText || ''),
          enabled: acc.enabled !== false,
        };
      });

      const sanitizedProjects = (parsed.portfolioData?.projects || []).map((proj, idx) => ({
        id: String(proj.id || `proj-ai-${Date.now()}-${idx}`),
        title: String(proj.title || 'Untitled Project'),
        role: String(proj.role || 'Developer'),
        techStack: Array.isArray(proj.techStack) ? proj.techStack.map(String).filter(Boolean) : [],
        liveUrl: sanitizeExternalUrl(proj.liveUrl),
        repoUrl: sanitizeExternalUrl(proj.repoUrl),
        summary: String(proj.summary || ''),
        highlights: Array.isArray(proj.highlights) ? proj.highlights.map(String).filter(Boolean) : [],
      }));

      res.json({
        reply: String(parsed.reply || 'Updated your resume and portfolio.'),
        changesSummary: Array.isArray(parsed.changesSummary)
          ? parsed.changesSummary.map(String).filter(Boolean)
          : ['Applied requested updates'],
        uiPreferences: {
          previewMode: validPreview,
          resumeTemplate: validTemplate,
          portfolioTheme: validTheme,
          showPhotoOnResume,
          accentColor: validAccent,
        },
        portfolioData: {
          profile: {
            fullName: String(parsed.portfolioData?.profile?.fullName || ''),
            headline: String(parsed.portfolioData?.profile?.headline || ''),
            portfolioTagline: String(parsed.portfolioData?.profile?.portfolioTagline || ''),
            email: String(parsed.portfolioData?.profile?.email || ''),
            phone: String(parsed.portfolioData?.profile?.phone || ''),
            location: String(parsed.portfolioData?.profile?.location || ''),
            availability: String(parsed.portfolioData?.profile?.availability || ''),
            showPhotoOnResume,
            summary: String(parsed.portfolioData?.profile?.summary || ''),
          },
          accounts: sanitizedAccounts,
          education: (parsed.portfolioData?.education || []).map((edu, idx) => ({
            id: String(edu.id || `edu-ai-${Date.now()}-${idx}`),
            institution: String(edu.institution || ''),
            degree: String(edu.degree || ''),
            field: String(edu.field || ''),
            startYear: String(edu.startYear || ''),
            endYear: String(edu.endYear || ''),
            gpa: String(edu.gpa || ''),
            coursework: String(edu.coursework || ''),
          })),
          projects: sanitizedProjects,
          experience: (parsed.portfolioData?.experience || []).map((exp, idx) => ({
            id: String(exp.id || `exp-ai-${Date.now()}-${idx}`),
            organization: String(exp.organization || ''),
            role: String(exp.role || ''),
            type: String(exp.type || 'Experience'),
            period: String(exp.period || ''),
            location: String(exp.location || ''),
            highlights: Array.isArray(exp.highlights) ? exp.highlights.map(String).filter(Boolean) : [],
          })),
          skills: (parsed.portfolioData?.skills || []).map((grp, idx) => ({
            id: String(grp.id || `skill-ai-${Date.now()}-${idx}`),
            category: String(grp.category || 'Skills'),
            items: Array.isArray(grp.items) ? grp.items.map(String).filter(Boolean) : [],
          })),
          achievements: (parsed.portfolioData?.achievements || []).map((ach, idx) => ({
            id: String(ach.id || `ach-ai-${Date.now()}-${idx}`),
            title: String(ach.title || ''),
            issuer: String(ach.issuer || ''),
            date: String(ach.date || ''),
            detail: String(ach.detail || ''),
          })),
          customSections: (parsed.portfolioData?.customSections || []).map((sec, idx) => ({
            id: String(sec.id || `sec-ai-${Date.now()}-${idx}`),
            title: String(sec.title || 'Additional Information'),
            entries: Array.isArray(sec.entries)
              ? (sec.entries as Array<Record<string, unknown>>).map((entry) => ({
                  heading: String(entry.heading || ''),
                  subheading: String(entry.subheading || ''),
                  detail: String(entry.detail || ''),
                }))
              : [],
          })),
        },
      });
    } catch (err) {
      const mapped = mapGeminiError(err);
      res.status(mapped.status).json({ error: mapped.message });
    }
  });

  // 6. Quick single-item AI rewrite
  app.post('/api/ai/refine', async (req: Request, res: Response) => {
    const ai = getGeminiClient();
    if (!ai) {
      res.status(500).json({
        error: 'Gemini API key is not configured. Add GEMINI_API_KEY in Settings > Secrets or Environment Variables.',
      });
      return;
    }

    try {
      const { kind, content, targetRole } = req.body as {
        kind: 'summary' | 'project';
        content: Record<string, unknown>;
        targetRole?: string;
      };

      if (kind === 'summary') {
        const response = await callGeminiWithRetry(() =>
          ai.models.generateContent({
            model: 'gemini-4-hydrogen',
            contents: `Rewrite this beginner developer resume summary to be crisp, authentic, and ATS-friendly (2-3 sentences max) for target role "${targetRole || 'Software Engineer Intern'}". Keep only factual details.\n\nDraft:\n${JSON.stringify(content)}`,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  summary: { type: Type.STRING },
                  portfolioTagline: { type: Type.STRING },
                },
                required: ['summary', 'portfolioTagline'],
              },
            },
          })
        );
        res.json(JSON.parse(response.text || '{}'));
        return;
      }

      if (kind === 'project') {
        const response = await callGeminiWithRetry(() =>
          ai.models.generateContent({
            model: 'gemini-4-hydrogen',
            contents: `Polish this beginner coding project's summary (1-2 sentences) and 3 crisp ATS resume bullet points for target role "${targetRole || 'Software Developer'}". Stay faithful to the provided tech stack and facts.\n\nProject:\n${JSON.stringify(content)}`,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  summary: { type: Type.STRING },
                  highlights: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ['summary', 'highlights'],
              },
            },
          })
        );
        res.json(JSON.parse(response.text || '{}'));
        return;
      }

      res.status(400).json({ error: 'Unsupported refine kind.' });
    } catch (err) {
      const mapped = mapGeminiError(err);
      res.status(mapped.status).json({ error: mapped.message });
    }
  });

  // Always return JSON for unknown /api/* routes so clients never receive plain-text/HTML 404s
  app.use('/api', (_req: Request, res: Response) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });

  return app;
}
