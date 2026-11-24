export type PlatformId =
  | 'github'
  | 'vercel'
  | 'leetcode'
  | 'hackerrank'
  | 'codechef'
  | 'codeforces'
  | 'linkedin'
  | 'kaggle'
  | 'stackoverflow'
  | 'hashnode'
  | 'behance'
  | 'x'
  | 'website'
  | 'custom';

export interface LinkedAccount {
  id: string;
  platform: PlatformId;
  label: string;
  username: string;
  url: string;
  statText: string;
  enabled: boolean;
}

export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startYear: string;
  endYear: string;
  gpa: string;
  coursework: string;
}

export interface ProjectItem {
  id: string;
  title: string;
  role: string;
  techStack: string[];
  liveUrl: string;
  repoUrl: string;
  coverImage: string;
  summary: string;
  highlights: string[];
}

export interface ExperienceItem {
  id: string;
  organization: string;
  role: string;
  type: string;
  period: string;
  location: string;
  highlights: string[];
}

export interface SkillGroup {
  id: string;
  category: string;
  items: string[];
}

export interface AchievementItem {
  id: string;
  title: string;
  issuer: string;
  date: string;
  detail: string;
}

export interface CustomSectionEntry {
  heading: string;
  subheading: string;
  detail: string;
}

export interface CustomSection {
  id: string;
  title: string;
  entries: CustomSectionEntry[];
}

export interface PersonalProfile {
  fullName: string;
  headline: string;
  portfolioTagline: string;
  email: string;
  phone: string;
  location: string;
  availability: string;
  photoDataUrl: string;
  showPhotoOnResume: boolean;
  summary: string;
}

export type ResumeTemplate = 'classic' | 'modern';
export type PortfolioTheme = 'editorial' | 'monograph' | 'paper';
export type AccentColor = 'blue' | 'emerald' | 'rose' | 'amber' | 'slate';

export interface PortfolioData {
  profile: PersonalProfile;
  accounts: LinkedAccount[];
  education: EducationItem[];
  projects: ProjectItem[];
  experience: ExperienceItem[];
  skills: SkillGroup[];
  achievements: AchievementItem[];
  customSections?: CustomSection[];
}

export interface AIGenerationInput {
  rawNotes: string;
  targetRole: string;
  tone: 'ATS Concise' | 'Storytelling & Builder' | 'Competitive & Technical';
  jobDescription: string;
  includeCodingStats: boolean;
}

export interface GitHubSyncedRepo {
  name: string;
  description: string;
  htmlUrl: string;
  homepage: string;
  language: string;
  stars: number;
  forks: number;
  topics: string[];
}

export interface GitHubSyncResponse {
  username: string;
  name: string;
  bio: string;
  avatarUrl: string;
  publicRepos: number;
  followers: number;
  location: string;
  blog: string;
  repos: GitHubSyncedRepo[];
}

export type PreviewMode = 'resume' | 'portfolio';

export interface UIPreferences {
  previewMode: PreviewMode;
  resumeTemplate: ResumeTemplate;
  portfolioTheme: PortfolioTheme;
  showPhotoOnResume: boolean;
  accentColor?: AccentColor;
}

export interface WorkspaceSnapshot {
  data: PortfolioData;
  ui: UIPreferences;
}

export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  changesSummary?: string[];
  snapshotBefore?: WorkspaceSnapshot;
  undone?: boolean;
  status?: 'ok' | 'error';
  timestamp: string;
}

export interface AIInstructResponse {
  reply: string;
  changesSummary: string[];
  portfolioData: Omit<PortfolioData, 'profile'> & {
    profile: Omit<PersonalProfile, 'photoDataUrl'>;
  };
  uiPreferences: UIPreferences;
}
