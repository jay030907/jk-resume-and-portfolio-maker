import {
  AccentColor,
  FontStyleId,
  PlatformId,
  PortfolioData,
  UIPreferences,
  WallpaperPreset,
} from '../types/portfolio';

export interface PlatformMeta {
  id: PlatformId;
  name: string;
  placeholderHandle: string;
  placeholderStat: string;
  buildUrl: (handle: string) => string;
  supportsSync?: boolean;
}

export interface FontStyleOption {
  id: FontStyleId;
  label: string;
  description: string;
  headingStack: string;
  bodyStack: string;
  sampleText: string;
}

export interface WallpaperOption {
  id: Exclude<WallpaperPreset, 'custom'>;
  label: string;
  description: string;
  previewSwatch: string;
}

export interface AccentOption {
  id: AccentColor;
  label: string;
  swatchClass: string;
}

export const FONT_STYLE_OPTIONS: FontStyleOption[] = [
  {
    id: 'jakarta',
    label: 'Modern Sans',
    description: 'Plus Jakarta Sans',
    headingStack: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif',
    bodyStack: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif',
    sampleText: 'Aa Bb · Clean Geometric',
  },
  {
    id: 'serif',
    label: 'Editorial Serif',
    description: 'Source Serif 4',
    headingStack: '"Source Serif 4", Georgia, Cambria, serif',
    bodyStack: '"Source Serif 4", Georgia, Cambria, serif',
    sampleText: 'Aa Bb · Classic Book',
  },
  {
    id: 'playfair',
    label: 'Literary Display',
    description: 'Playfair Display + Sans',
    headingStack: '"Playfair Display", Georgia, serif',
    bodyStack: '"Plus Jakarta Sans", -apple-system, sans-serif',
    sampleText: 'Aa Bb · High-Contrast',
  },
  {
    id: 'outfit',
    label: 'Studio Geometric',
    description: 'Outfit',
    headingStack: '"Outfit", -apple-system, sans-serif',
    bodyStack: '"Outfit", -apple-system, sans-serif',
    sampleText: 'Aa Bb · Crisp Display',
  },
  {
    id: 'manrope',
    label: 'Humanist Sans',
    description: 'Manrope',
    headingStack: '"Manrope", -apple-system, sans-serif',
    bodyStack: '"Manrope", -apple-system, sans-serif',
    sampleText: 'Aa Bb · Balanced Warmth',
  },
  {
    id: 'mono',
    label: 'Technical Mono',
    description: 'JetBrains Mono',
    headingStack: '"JetBrains Mono", ui-monospace, monospace',
    bodyStack: '"JetBrains Mono", ui-monospace, monospace',
    sampleText: 'Aa Bb · Developer Mono',
  },
];

export const WALLPAPER_OPTIONS: WallpaperOption[] = [
  {
    id: 'clean',
    label: 'Clean Canvas',
    description: 'Pure minimal surface',
    previewSwatch: 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)',
  },
  {
    id: 'blueprint',
    label: 'Blueprint Grid',
    description: 'Architectural hairline grid',
    previewSwatch:
      'linear-gradient(to right, rgba(37,99,235,0.14) 1px, transparent 1px), linear-gradient(to bottom, rgba(37,99,235,0.14) 1px, transparent 1px), #f8fafc',
  },
  {
    id: 'studio-gradient',
    label: 'Studio Horizon',
    description: 'Soft atmospheric studio glow',
    previewSwatch:
      'radial-gradient(circle at 20% 20%, rgba(59,130,246,0.22), transparent 55%), radial-gradient(circle at 80% 80%, rgba(14,165,233,0.16), transparent 55%), #ffffff',
  },
  {
    id: 'contour',
    label: 'Dot Matrix',
    description: 'Precision studio dot pattern',
    previewSwatch:
      'radial-gradient(rgba(15,23,42,0.22) 1.2px, transparent 1.2px), #f8fafc',
  },
  {
    id: 'warm-linen',
    label: 'Woven Paper',
    description: 'Fine diagonal editorial texture',
    previewSwatch:
      'repeating-linear-gradient(45deg, rgba(120,113,108,0.08) 0px, rgba(120,113,108,0.08) 1px, transparent 1px, transparent 8px), #faf8f5',
  },
  {
    id: 'obsidian-mesh',
    label: 'Aurora Mesh',
    description: 'Layered multi-tone depth wash',
    previewSwatch:
      'radial-gradient(circle at 15% 15%, rgba(16,185,129,0.22), transparent 48%), radial-gradient(circle at 85% 25%, rgba(59,130,246,0.24), transparent 50%), #0f172a',
  },
];

export const ACCENT_OPTIONS: AccentOption[] = [
  { id: 'blue', label: 'Cobalt Blue', swatchClass: 'bg-blue-600' },
  { id: 'emerald', label: 'Emerald', swatchClass: 'bg-emerald-600' },
  { id: 'rose', label: 'Crimson Rose', swatchClass: 'bg-rose-600' },
  { id: 'amber', label: 'Amber Gold', swatchClass: 'bg-amber-600' },
  { id: 'slate', label: 'Obsidian Slate', swatchClass: 'bg-slate-900' },
];

export const DEFAULT_UI_PREFERENCES: UIPreferences = {
  previewMode: 'resume',
  resumeTemplate: 'classic',
  portfolioTheme: 'editorial',
  showPhotoOnResume: true,
  accentColor: 'blue',
  wallpaper: 'clean',
  customWallpaperUrl: '',
  fontStyle: 'jakarta',
};

export const PLATFORM_CATALOG: PlatformMeta[] = [
  {
    id: 'github',
    name: 'GitHub',
    placeholderHandle: 'aarav-dev',
    placeholderStat: '24 Repos · 140+ Commits',
    buildUrl: (h) => `https://github.com/${h}`,
    supportsSync: true,
  },
  {
    id: 'vercel',
    name: 'Vercel',
    placeholderHandle: 'aarav-builds',
    placeholderStat: '8 Live Deployments',
    buildUrl: (h) => `https://vercel.com/${h}`,
  },
  {
    id: 'leetcode',
    name: 'LeetCode',
    placeholderHandle: 'aarav_codes',
    placeholderStat: '215 Solved (120 Med · 22 Hard)',
    buildUrl: (h) => `https://leetcode.com/u/${h}`,
    supportsSync: true,
  },
  {
    id: 'hackerrank',
    name: 'HackerRank',
    placeholderHandle: 'aarav_hr',
    placeholderStat: '5★ Python · 5★ Problem Solving',
    buildUrl: (h) => `https://www.hackerrank.com/profile/${h}`,
  },
  {
    id: 'codechef',
    name: 'CodeChef',
    placeholderHandle: 'aarav_cc',
    placeholderStat: '3★ Rated · 1648 Peak',
    buildUrl: (h) => `https://www.codechef.com/users/${h}`,
  },
  {
    id: 'codeforces',
    name: 'Codeforces',
    placeholderHandle: 'aarav_cf',
    placeholderStat: 'Specialist · 1435 Rating',
    buildUrl: (h) => `https://codeforces.com/profile/${h}`,
    supportsSync: true,
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    placeholderHandle: 'in/aarav-sharma-dev',
    placeholderStat: 'Open to Summer Internships',
    buildUrl: (h) => (h.startsWith('in/') ? `https://linkedin.com/${h}` : `https://linkedin.com/in/${h}`),
  },
  {
    id: 'kaggle',
    name: 'Kaggle',
    placeholderHandle: 'aaravdata',
    placeholderStat: 'Notebooks Contributor · 3 Medals',
    buildUrl: (h) => `https://www.kaggle.com/${h}`,
  },
  {
    id: 'stackoverflow',
    name: 'Stack Overflow',
    placeholderHandle: 'users/123456/aarav',
    placeholderStat: '1,240 Reputation',
    buildUrl: (h) => `https://stackoverflow.com/${h}`,
  },
  {
    id: 'hashnode',
    name: 'Hashnode / Dev Blog',
    placeholderHandle: '@aaravwrites',
    placeholderStat: '12 Technical Articles',
    buildUrl: (h) => `https://hashnode.com/${h}`,
  },
  {
    id: 'behance',
    name: 'Behance / Dribbble',
    placeholderHandle: 'aaravui',
    placeholderStat: 'UI Case Studies',
    buildUrl: (h) => `https://www.behance.net/${h}`,
  },
  {
    id: 'x',
    name: 'X (Twitter)',
    placeholderHandle: 'aarav_ships',
    placeholderStat: '#BuildInPublic',
    buildUrl: (h) => `https://x.com/${h}`,
  },
  {
    id: 'website',
    name: 'Personal Domain',
    placeholderHandle: 'aaravsharma.dev',
    placeholderStat: 'Custom Portfolio Site',
    buildUrl: (h) => (h.startsWith('http') ? h : `https://${h}`),
  },
];

export const SAMPLE_AVATAR_URL = '/images/sample_beginner_avatar_1795496683529.jpg';
export const SAMPLE_PROJECT_COVER_ONE = '/images/portfolio_project_cover_one_1795496683853.jpg';
export const SAMPLE_PROJECT_COVER_TWO = '/images/portfolio_project_cover_two_1795496684065.jpg';

export const DEFAULT_PORTFOLIO_DATA: PortfolioData = {
  profile: {
    fullName: 'Aarav Sharma',
    headline: 'Computer Science Undergraduate & Full-Stack Builder',
    portfolioTagline:
      'Turning curiosity into shipped web applications, clean algorithms, and practical developer tools.',
    email: 'aarav.sharma.dev@example.com',
    phone: '+1 (415) 555-0194',
    location: 'Bengaluru / San Jose',
    availability: 'Seeking Software Engineering Internships (2026)',
    photoDataUrl: SAMPLE_AVATAR_URL,
    showPhotoOnResume: true,
    summary:
      'Second-year Computer Science student focused on TypeScript, React, and backend API design. Solved 350+ algorithmic problems across LeetCode, CodeChef, and HackerRank while shipping full-stack side projects deployed on Vercel and GitHub.',
  },
  accounts: [
    {
      id: 'acc-github',
      platform: 'github',
      label: 'GitHub',
      username: 'aarav-sharma-dev',
      url: 'https://github.com/aarav-sharma-dev',
      statText: '18 Public Repos · 320+ Commits',
      enabled: true,
    },
    {
      id: 'acc-vercel',
      platform: 'vercel',
      label: 'Vercel',
      username: 'aarav-builds',
      url: 'https://vercel.com/aarav-builds',
      statText: '6 Live Web Deployments',
      enabled: true,
    },
    {
      id: 'acc-leetcode',
      platform: 'leetcode',
      label: 'LeetCode',
      username: 'aarav_lc',
      url: 'https://leetcode.com/u/aarav_lc',
      statText: '215 Solved · Top 18% Contest',
      enabled: true,
    },
    {
      id: 'acc-codechef',
      platform: 'codechef',
      label: 'CodeChef',
      username: 'aarav_cc',
      url: 'https://www.codechef.com/users/aarav_cc',
      statText: '3★ Rated · 1642 Max Rating',
      enabled: true,
    },
    {
      id: 'acc-hackerrank',
      platform: 'hackerrank',
      label: 'HackerRank',
      username: 'aarav_hr',
      url: 'https://www.hackerrank.com/profile/aarav_hr',
      statText: '5★ Python · 5★ Problem Solving',
      enabled: true,
    },
    {
      id: 'acc-linkedin',
      platform: 'linkedin',
      label: 'LinkedIn',
      username: 'aarav-sharma-dev',
      url: 'https://linkedin.com/in/aarav-sharma-dev',
      statText: 'Open to Engineering Internships',
      enabled: true,
    },
  ],
  education: [
    {
      id: 'edu-1',
      institution: 'National Institute of Technology',
      degree: 'B.Tech in Computer Science & Engineering',
      field: 'Computer Science',
      startYear: '2024',
      endYear: '2028',
      gpa: '8.9 / 10.0',
      coursework: 'Data Structures & Algorithms, Operating Systems, DBMS, Web Engineering',
    },
  ],
  projects: [
    {
      id: 'proj-1',
      title: 'DeployPulse — GitHub & Vercel Preview Tracker',
      role: 'Solo Creator',
      techStack: ['React', 'TypeScript', 'Node.js', 'Tailwind CSS', 'GitHub API'],
      liveUrl: 'https://deploypulse.vercel.app',
      repoUrl: 'https://github.com/aarav-sharma-dev/deploypulse',
      coverImage: SAMPLE_PROJECT_COVER_ONE,
      summary:
        'A lightweight dashboard helping student teams monitor preview deployments, build logs, and commit statuses across repositories in one place.',
      highlights: [
        'Integrated GitHub REST webhooks and Vercel deployment status polling to cut manual PR checks by 60%.',
        'Built responsive status filters and keyboard shortcuts with React and TypeScript, maintaining <100ms UI updates.',
        'Deployed zero-downtime preview builds on Vercel with automated environment validation.',
      ],
    },
    {
      id: 'proj-2',
      title: 'AlgoStreak — Daily DSA & Spaced Repetition Log',
      role: 'Full-Stack Developer',
      techStack: ['TypeScript', 'Express', 'PostgreSQL', 'Vite'],
      liveUrl: 'https://algostreak.vercel.app',
      repoUrl: 'https://github.com/aarav-sharma-dev/algostreak',
      coverImage: SAMPLE_PROJECT_COVER_TWO,
      summary:
        'A mobile-friendly practice companion that schedules LeetCode and CodeChef revisions using spaced repetition intervals.',
      highlights: [
        'Designed a spaced-repetition queue that resurfaces tough graph and DP problems at 3, 7, and 21-day intervals.',
        'Synced solved problem tags across LeetCode and CodeChef logs to highlight weak algorithmic topics.',
        'Adopted by 85+ classmates during campus placement preparation.',
      ],
    },
  ],
  experience: [
    {
      id: 'exp-1',
      organization: 'Campus Open Source Collective',
      role: 'Web Engineering Mentor & Contributor',
      type: 'Student Organization',
      period: 'Aug 2025 – Present',
      location: 'On-Campus',
      highlights: [
        'Reviewed 40+ beginner pull requests on React and Git workflows during Hacktoberfest prep.',
        'Hosted two hands-on workshops teaching 120 freshmen how to deploy their first portfolio on GitHub Pages and Vercel.',
      ],
    },
    {
      id: 'exp-2',
      organization: 'HackSprint 2025 (36-Hour Hackathon)',
      role: 'Frontend & API Lead — Top 5 Finalist',
      type: 'Hackathon',
      period: 'Mar 2025',
      location: 'Bengaluru',
      highlights: [
        'Built an accessible campus study-room finder with live occupancy updates and instant booking.',
        'Ranked top 5 out of 90+ participating student teams for clean UX and working end-to-end deployment.',
      ],
    },
  ],
  skills: [
    {
      id: 'skill-1',
      category: 'Languages',
      items: ['TypeScript', 'JavaScript', 'Python', 'C++', 'SQL'],
    },
    {
      id: 'skill-2',
      category: 'Frontend & UI',
      items: ['React', 'Next.js', 'Tailwind CSS', 'HTML5', 'Responsive Design'],
    },
    {
      id: 'skill-3',
      category: 'Backend & Tools',
      items: ['Node.js', 'Express', 'Git & GitHub', 'Vercel', 'PostgreSQL', 'REST APIs'],
    },
    {
      id: 'skill-4',
      category: 'CS Fundamentals',
      items: ['Data Structures', 'Algorithms', 'OOP', 'DBMS', 'Operating Systems'],
    },
  ],
  achievements: [
    {
      id: 'ach-1',
      title: '3-Star Coder (1642 Peak Rating)',
      issuer: 'CodeChef',
      date: '2026',
      detail: 'Placed in Top 8% in CodeChef Starters Division 2.',
    },
    {
      id: 'ach-2',
      title: '5-Star Gold Badge in Problem Solving & Python',
      issuer: 'HackerRank',
      date: '2025',
      detail: 'Completed advanced algorithmic and data structure tracks.',
    },
  ],
  customSections: [],
};

export const EMPTY_PORTFOLIO_DATA: PortfolioData = {
  profile: {
    fullName: '',
    headline: '',
    portfolioTagline: '',
    email: '',
    phone: '',
    location: '',
    availability: '',
    photoDataUrl: '',
    showPhotoOnResume: true,
    summary: '',
  },
  accounts: [
    {
      id: 'acc-github',
      platform: 'github',
      label: 'GitHub',
      username: '',
      url: '',
      statText: '',
      enabled: true,
    },
    {
      id: 'acc-vercel',
      platform: 'vercel',
      label: 'Vercel',
      username: '',
      url: '',
      statText: '',
      enabled: true,
    },
    {
      id: 'acc-leetcode',
      platform: 'leetcode',
      label: 'LeetCode',
      username: '',
      url: '',
      statText: '',
      enabled: true,
    },
    {
      id: 'acc-hackerrank',
      platform: 'hackerrank',
      label: 'HackerRank',
      username: '',
      url: '',
      statText: '',
      enabled: true,
    },
    {
      id: 'acc-codechef',
      platform: 'codechef',
      label: 'CodeChef',
      username: '',
      url: '',
      statText: '',
      enabled: true,
    },
    {
      id: 'acc-linkedin',
      platform: 'linkedin',
      label: 'LinkedIn',
      username: '',
      url: '',
      statText: '',
      enabled: true,
    },
  ],
  education: [],
  projects: [],
  experience: [],
  skills: [],
  achievements: [],
  customSections: [],
};
