import React, { useRef, useState } from 'react';
import {
  Plus,
  Trash2,
  Upload,
  RefreshCw,
  Wand2,
  ExternalLink,
  Check,
  User,
  Download,
} from 'lucide-react';
import {
  PortfolioData,
  PlatformId,
  LinkedAccount,
  ProjectItem,
  EducationItem,
  ExperienceItem,
  SkillGroup,
  AchievementItem,
  GitHubSyncResponse,
  GitHubSyncedRepo,
} from '../types/portfolio';
import {
  PLATFORM_CATALOG,
  SAMPLE_AVATAR_URL,
  SAMPLE_PROJECT_COVER_ONE,
  SAMPLE_PROJECT_COVER_TWO,
} from '../data/presets';
import { PlatformIcon } from './PlatformIcon';
import { fetchJsonSafe } from '../utils/apiClient';

export type BuilderTab = 'identity' | 'links' | 'projects' | 'background';

interface BuilderSidebarProps {
  data: PortfolioData;
  onChange: (next: PortfolioData) => void;
  activeTab: BuilderTab;
  onTabChange: (tab: BuilderTab) => void;
  targetRole: string;
}

function resizeImageToDataUrl(file: File, maxSize = 480): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read selected image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image format.'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(reader.result));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.88));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export const BuilderSidebar: React.FC<BuilderSidebarProps> = ({
  data,
  onChange,
  activeTab,
  onTabChange,
  targetRole,
}) => {
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [githubRepos, setGithubRepos] = useState<GitHubSyncedRepo[]>([]);
  const [refiningKey, setRefiningKey] = useState<string | null>(null);
  const [newPlatform, setNewPlatform] = useState<PlatformId>('codeforces');
  const [customPlatformName, setCustomPlatformName] = useState('');

  const updateProfile = (patch: Partial<PortfolioData['profile']>) => {
    onChange({ ...data, profile: { ...data.profile, ...patch } });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setSyncMessage({ type: 'err', text: 'Please upload a PNG, JPG, or WebP image.' });
      return;
    }
    try {
      const dataUrl = await resizeImageToDataUrl(file, 520);
      updateProfile({ photoDataUrl: dataUrl });
      setSyncMessage({ type: 'ok', text: 'Profile photo updated.' });
    } catch (err) {
      setSyncMessage({
        type: 'err',
        text: err instanceof Error ? err.message : 'Failed to process image.',
      });
    }
  };

  const handleProjectCoverUpload = async (projectId: string, file: File) => {
    try {
      const dataUrl = await resizeImageToDataUrl(file, 840);
      onChange({
        ...data,
        projects: data.projects.map((p) => (p.id === projectId ? { ...p, coverImage: dataUrl } : p)),
      });
    } catch {
      setSyncMessage({ type: 'err', text: 'Could not process project image.' });
    }
  };

  const updateAccount = (id: string, patch: Partial<LinkedAccount>) => {
    onChange({
      ...data,
      accounts: data.accounts.map((acc) => {
        if (acc.id !== id) return acc;
        const next = { ...acc, ...patch };
        // Auto-build URL when username changes and URL matches default pattern or is empty
        if (patch.username !== undefined) {
          const meta = PLATFORM_CATALOG.find((m) => m.id === acc.platform);
          const cleanHandle = patch.username.trim().replace(/^@/, '');
          if (meta && cleanHandle && (!acc.url || acc.url === meta.buildUrl(acc.username.trim().replace(/^@/, '')))) {
            next.url = meta.buildUrl(cleanHandle);
          }
        }
        return next;
      }),
    });
  };

  const addAccount = () => {
    const meta = PLATFORM_CATALOG.find((m) => m.id === newPlatform);
    const label = newPlatform === 'custom' ? customPlatformName.trim() || 'Custom Link' : meta?.name || 'Platform';
    const nextAcc: LinkedAccount = {
      id: `acc-${Date.now()}`,
      platform: newPlatform,
      label,
      username: '',
      url: '',
      statText: '',
      enabled: true,
    };
    onChange({ ...data, accounts: [...data.accounts, nextAcc] });
    setCustomPlatformName('');
  };

  const removeAccount = (id: string) => {
    onChange({ ...data, accounts: data.accounts.filter((a) => a.id !== id) });
  };

  const syncAccountStats = async (acc: LinkedAccount) => {
    const handle = acc.username.trim().replace(/^@/, '');
    if (!handle) {
      setSyncMessage({ type: 'err', text: `Enter your ${acc.label} username first to sync stats.` });
      return;
    }
    setSyncingId(acc.id);
    setSyncMessage(null);

    try {
      if (acc.platform === 'github') {
        const json = await fetchJsonSafe<GitHubSyncResponse>(
          `/api/profiles/github/${encodeURIComponent(handle)}`
        );

        const statText = `${json.publicRepos} Public Repos · ${json.followers} Followers`;
        const updatedAccounts = data.accounts.map((a) =>
          a.id === acc.id
            ? { ...a, username: json.username, url: `https://github.com/${json.username}`, statText }
            : a
        );
        const nextProfile = { ...data.profile };
        if (!nextProfile.fullName && json.name) nextProfile.fullName = json.name;
        if (!nextProfile.location && json.location) nextProfile.location = json.location;
        if (!nextProfile.summary && json.bio) nextProfile.summary = json.bio;

        onChange({ ...data, profile: nextProfile, accounts: updatedAccounts });
        setGithubRepos(json.repos || []);
        setSyncMessage({
          type: 'ok',
          text: `Synced @${json.username} (${json.publicRepos} repos). You can import repositories in the Projects tab.`,
        });
      } else if (acc.platform === 'codeforces') {
        const json = await fetchJsonSafe<{
          handle?: string;
          rating?: number;
          maxRating?: number;
          rank?: string;
        }>(`/api/profiles/codeforces/${encodeURIComponent(handle)}`);

        const rankLabel = json.rank ? json.rank.charAt(0).toUpperCase() + json.rank.slice(1) : 'Rated';
        const statText = `${rankLabel} · ${json.rating || 0} Rating (Max ${json.maxRating || 0})`;
        updateAccount(acc.id, {
          username: json.handle || handle,
          url: `https://codeforces.com/profile/${json.handle || handle}`,
          statText,
        });
        setSyncMessage({ type: 'ok', text: `Synced Codeforces stats for ${json.handle || handle}.` });
      } else if (acc.platform === 'leetcode') {
        const json = await fetchJsonSafe<{
          username?: string;
          totalSolved?: number;
          mediumSolved?: number;
          hardSolved?: number;
        }>('/api/profiles/leetcode', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: handle }),
        });

        const statText = `${json.totalSolved ?? 0} Solved (${json.mediumSolved ?? 0} Med · ${json.hardSolved ?? 0} Hard)`;
        updateAccount(acc.id, {
          username: json.username || handle,
          url: `https://leetcode.com/u/${json.username || handle}`,
          statText,
        });
        setSyncMessage({ type: 'ok', text: `Synced LeetCode stats for ${json.username || handle}.` });
      }
    } catch (err) {
      setSyncMessage({
        type: 'err',
        text: err instanceof Error ? err.message : 'Sync failed. You can enter stats manually.',
      });
    } finally {
      setSyncingId(null);
    }
  };

  const importGithubRepoAsProject = (repo: GitHubSyncedRepo) => {
    const exists = data.projects.some((p) => p.repoUrl === repo.htmlUrl);
    if (exists) return;
    const newProject: ProjectItem = {
      id: `proj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: repo.name,
      role: 'Creator',
      techStack: [repo.language, ...repo.topics].filter(Boolean).slice(0, 5),
      liveUrl: repo.homepage || '',
      repoUrl: repo.htmlUrl,
      coverImage: data.projects.length % 2 === 0 ? SAMPLE_PROJECT_COVER_ONE : SAMPLE_PROJECT_COVER_TWO,
      summary: repo.description || `Open-source project built with ${repo.language || 'modern web technologies'}.`,
      highlights: [
        repo.description || `Engineered ${repo.name} and published source code on GitHub.`,
        repo.stars > 0 ? `Earned ${repo.stars} stars from the developer community.` : 'Structured modular repository with clean documentation.',
      ],
    };
    onChange({ ...data, projects: [...data.projects, newProject] });
    setSyncMessage({ type: 'ok', text: `Imported "${repo.name}" into Projects.` });
  };

  const refineSummaryWithAI = async () => {
    setRefiningKey('summary');
    setSyncMessage(null);
    try {
      const json = await fetchJsonSafe<{ summary?: string; portfolioTagline?: string }>('/api/ai/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'summary',
          targetRole,
          content: {
            fullName: data.profile.fullName,
            headline: data.profile.headline,
            summary: data.profile.summary,
            skills: data.skills,
            accounts: data.accounts.filter((a) => a.enabled && a.username).map((a) => `${a.label}: ${a.statText || a.username}`),
          },
        }),
      });
      updateProfile({
        summary: json.summary || data.profile.summary,
        portfolioTagline: json.portfolioTagline || data.profile.portfolioTagline,
      });
      setSyncMessage({ type: 'ok', text: 'Polished summary & portfolio tagline with AI.' });
    } catch (err) {
      setSyncMessage({ type: 'err', text: err instanceof Error ? err.message : 'AI polish failed' });
    } finally {
      setRefiningKey(null);
    }
  };

  const refineProjectWithAI = async (project: ProjectItem) => {
    setRefiningKey(project.id);
    setSyncMessage(null);
    try {
      const json = await fetchJsonSafe<{ summary?: string; highlights?: string[] }>('/api/ai/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'project',
          targetRole,
          content: project,
        }),
      });
      onChange({
        ...data,
        projects: data.projects.map((p) =>
          p.id === project.id
            ? {
                ...p,
                summary: json.summary || p.summary,
                highlights: json.highlights && json.highlights.length > 0 ? json.highlights : p.highlights,
              }
            : p
        ),
      });
      setSyncMessage({ type: 'ok', text: `Polished "${project.title}" bullets with AI.` });
    } catch (err) {
      setSyncMessage({ type: 'err', text: err instanceof Error ? err.message : 'AI polish failed' });
    } finally {
      setRefiningKey(null);
    }
  };

  const addProject = () => {
    const newProj: ProjectItem = {
      id: `proj-${Date.now()}`,
      title: 'New Project',
      role: 'Developer',
      techStack: ['React', 'TypeScript'],
      liveUrl: '',
      repoUrl: '',
      coverImage: data.projects.length % 2 === 0 ? SAMPLE_PROJECT_COVER_ONE : SAMPLE_PROJECT_COVER_TWO,
      summary: 'Brief overview of the problem solved and what you built.',
      highlights: ['Built core features and deployed live demo.'],
    };
    onChange({ ...data, projects: [...data.projects, newProj] });
  };

  const addEducation = () => {
    const next: EducationItem = {
      id: `edu-${Date.now()}`,
      institution: '',
      degree: '',
      field: '',
      startYear: '2024',
      endYear: '2028',
      gpa: '',
      coursework: '',
    };
    onChange({ ...data, education: [...data.education, next] });
  };

  const addExperience = () => {
    const next: ExperienceItem = {
      id: `exp-${Date.now()}`,
      organization: '',
      role: '',
      type: 'Internship / Hackathon',
      period: '',
      location: '',
      highlights: ['Describe what you built, collaborated on, or achieved.'],
    };
    onChange({ ...data, experience: [...data.experience, next] });
  };

  const addSkillGroup = () => {
    const next: SkillGroup = {
      id: `skill-${Date.now()}`,
      category: 'Tools & Frameworks',
      items: ['Git', 'VS Code'],
    };
    onChange({ ...data, skills: [...data.skills, next] });
  };

  const addAchievement = () => {
    const next: AchievementItem = {
      id: `ach-${Date.now()}`,
      title: '',
      issuer: '',
      date: '2026',
      detail: '',
    };
    onChange({ ...data, achievements: [...data.achievements, next] });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Sub-navigation segmented tabs */}
      <div className="px-4 pt-4 pb-3 border-b border-slate-200 bg-white">
        <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-lg">
          {(
            [
              { id: 'identity', label: 'Identity' },
              { id: 'links', label: 'Accounts' },
              { id: 'projects', label: 'Projects' },
              { id: 'background', label: 'Resume' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`px-2 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Inline status feedback */}
      {syncMessage && (
        <div
          className={`mx-4 mt-3 px-3 py-2 rounded-lg text-xs border flex items-center justify-between gap-2 ${
            syncMessage.type === 'ok'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <span>{syncMessage.text}</span>
          <button
            type="button"
            onClick={() => setSyncMessage(null)}
            className="text-current opacity-70 hover:opacity-100 font-medium cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* TAB 1: IDENTITY & PROFILE PHOTO */}
        {activeTab === 'identity' && (
          <div className="space-y-5">
            {/* Profile Photo Upload */}
            <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">Profile Photo</h3>
                <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={data.profile.showPhotoOnResume}
                    onChange={(e) => updateProfile({ showPhotoOnResume: e.target.checked })}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  Show on Resume
                </label>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden shrink-0 flex items-center justify-center">
                  {data.profile.photoDataUrl ? (
                    <img
                      src={data.profile.photoDataUrl}
                      alt={data.profile.fullName || 'Profile'}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-7 h-7 text-slate-400" />
                  )}
                </div>
                <div className="flex flex-col gap-2 flex-1">
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Upload Photo
                    </button>
                    {data.profile.photoDataUrl && (
                      <button
                        type="button"
                        onClick={() => updateProfile({ photoDataUrl: '' })}
                        className="px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                    {data.profile.photoDataUrl !== SAMPLE_AVATAR_URL && (
                      <button
                        type="button"
                        onClick={() => updateProfile({ photoDataUrl: SAMPLE_AVATAR_URL })}
                        className="px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        Use Sample
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    JPG, PNG, or WebP. Automatically cropped cleanly for both your portfolio and PDF resume.
                  </p>
                </div>
              </div>
            </div>

            {/* Personal Details */}
            <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3.5">
              <h3 className="text-sm font-semibold text-slate-900">Basic Information</h3>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={data.profile.fullName}
                    onChange={(e) => updateProfile({ fullName: e.target.value })}
                    placeholder="e.g. Aarav Sharma"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Headline / Target Role</label>
                  <input
                    type="text"
                    value={data.profile.headline}
                    onChange={(e) => updateProfile({ headline: e.target.value })}
                    placeholder="e.g. CS Student & Full-Stack Developer"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={data.profile.email}
                      onChange={(e) => updateProfile({ email: e.target.value })}
                      placeholder="you@example.com"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Phone</label>
                    <input
                      type="text"
                      value={data.profile.phone}
                      onChange={(e) => updateProfile({ phone: e.target.value })}
                      placeholder="+1 (555) 000-0000"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Location</label>
                    <input
                      type="text"
                      value={data.profile.location}
                      onChange={(e) => updateProfile({ location: e.target.value })}
                      placeholder="City, Country"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Availability</label>
                    <input
                      type="text"
                      value={data.profile.availability}
                      onChange={(e) => updateProfile({ availability: e.target.value })}
                      placeholder="Open to Internships"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bio & Portfolio Tagline */}
            <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-900">Summary & Tagline</h3>
                <button
                  type="button"
                  disabled={refiningKey === 'summary'}
                  onClick={refineSummaryWithAI}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors whitespace-nowrap shrink-0 disabled:opacity-50 cursor-pointer"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  {refiningKey === 'summary' ? 'Polishing...' : 'AI Polish'}
                </button>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Portfolio Hero Tagline</label>
                <input
                  type="text"
                  value={data.profile.portfolioTagline}
                  onChange={(e) => updateProfile({ portfolioTagline: e.target.value })}
                  placeholder="One memorable line introducing what you build"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Professional Summary (Resume & About)</label>
                <textarea
                  rows={4}
                  value={data.profile.summary}
                  onChange={(e) => updateProfile({ summary: e.target.value })}
                  placeholder="2–3 sentences about your skills, projects, and coding journey..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LINKED DEVELOPER & CODING ACCOUNTS */}
        {activeTab === 'links' && (
          <div className="space-y-4">
            <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Add Coding or Social Account</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Link GitHub, Vercel, LeetCode, HackerRank, CodeChef, Codeforces, Kaggle, and more.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  value={newPlatform}
                  onChange={(e) => setNewPlatform(e.target.value as PlatformId)}
                  className="flex-1 px-3 py-2 text-xs font-medium border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-blue-600"
                >
                  {PLATFORM_CATALOG.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                  <option value="custom">Custom Platform</option>
                </select>
                {newPlatform === 'custom' && (
                  <input
                    type="text"
                    value={customPlatformName}
                    onChange={(e) => setCustomPlatformName(e.target.value)}
                    placeholder="Platform name"
                    className="w-32 px-2.5 py-2 text-xs border border-slate-200 rounded-lg"
                  />
                )}
                <button
                  type="button"
                  onClick={addAccount}
                  className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
              </div>
            </div>

            {data.accounts.map((acc) => {
              const meta = PLATFORM_CATALOG.find((m) => m.id === acc.platform);
              const canSync = meta?.supportsSync;
              return (
                <div key={acc.id} className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-slate-700 shrink-0">
                        <PlatformIcon platform={acc.platform} className="w-4 h-4" />
                      </span>
                      <span className="text-sm font-semibold text-slate-900 truncate">{acc.label}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {canSync && (
                        <button
                          type="button"
                          disabled={syncingId === acc.id}
                          onClick={() => syncAccountStats(acc)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3 h-3 ${syncingId === acc.id ? 'animate-spin' : ''}`} />
                          {syncingId === acc.id ? 'Syncing' : 'Sync Live'}
                        </button>
                      )}
                      <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={acc.enabled}
                          onChange={(e) => updateAccount(acc.id, { enabled: e.target.checked })}
                          className="rounded border-slate-300 text-blue-600"
                        />
                        Show
                      </label>
                      <button
                        type="button"
                        onClick={() => removeAccount(acc.id)}
                        aria-label={`Remove ${acc.label}`}
                        className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">Username / Handle</label>
                      <input
                        type="text"
                        value={acc.username}
                        onChange={(e) => updateAccount(acc.id, { username: e.target.value })}
                        placeholder={meta?.placeholderHandle || 'username'}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">Highlight / Stats</label>
                      <input
                        type="text"
                        value={acc.statText}
                        onChange={(e) => updateAccount(acc.id, { statText: e.target.value })}
                        placeholder={meta?.placeholderStat || 'e.g. 180 Solved · 3★'}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Profile URL</label>
                    <div className="flex gap-1.5">
                      <input
                        type="url"
                        value={acc.url}
                        onChange={(e) => updateAccount(acc.id, { url: e.target.value })}
                        placeholder="https://..."
                        className="flex-1 px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg font-mono-tabular focus:outline-none focus:border-blue-600"
                      />
                      {acc.url && (
                        <a
                          href={acc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 border border-slate-200 rounded-lg text-slate-500 hover:text-slate-900"
                          title="Verify link"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 3: PROJECTS & GITHUB IMPORT */}
        {activeTab === 'projects' && (
          <div className="space-y-4">
            {githubRepos.length > 0 && (
              <div className="p-4 bg-white border border-blue-200 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-900">Import from Synced GitHub Repositories</h3>
                  <span className="text-[11px] text-slate-500 tabular-nums">{githubRepos.length} found</span>
                </div>
                <div className="space-y-2">
                  {githubRepos.map((repo) => {
                    const alreadyAdded = data.projects.some((p) => p.repoUrl === repo.htmlUrl);
                    return (
                      <div
                        key={repo.htmlUrl}
                        className="flex items-center justify-between gap-2 py-2 border-t border-slate-100 first:border-t-0"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-slate-900 truncate">{repo.name}</div>
                          <div className="text-[11px] text-slate-500 truncate">
                            {[repo.language, repo.stars > 0 ? `${repo.stars} stars` : ''].filter(Boolean).join(' · ') || 'Repository'}
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={alreadyAdded}
                          onClick={() => importGithubRepoAsProject(repo)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          {alreadyAdded ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              Added
                            </>
                          ) : (
                            <>
                              <Download className="w-3 h-3" />
                              Import
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Projects ({data.projects.length})</h3>
              <button
                type="button"
                onClick={addProject}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Project
              </button>
            </div>

            {data.projects.length === 0 && (
              <div className="p-6 bg-white border border-slate-200 rounded-xl text-center space-y-2">
                <p className="text-sm font-medium text-slate-900">No projects added yet</p>
                <p className="text-xs text-slate-500">
                  Add a personal or coursework project, or sync your GitHub in the Accounts tab to import repos.
                </p>
              </div>
            )}

            {data.projects.map((proj, idx) => (
              <div key={proj.id} className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-slate-500 tabular-nums">Project {idx + 1}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={refiningKey === proj.id}
                      onClick={() => refineProjectWithAI(proj)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
                    >
                      <Wand2 className="w-3 h-3" />
                      {refiningKey === proj.id ? 'Polishing...' : 'AI Polish'}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onChange({ ...data, projects: data.projects.filter((p) => p.id !== proj.id) })
                      }
                      className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                      aria-label="Delete project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Project Title</label>
                    <input
                      type="text"
                      value={proj.title}
                      onChange={(e) =>
                        onChange({
                          ...data,
                          projects: data.projects.map((p) => (p.id === proj.id ? { ...p, title: e.target.value } : p)),
                        })
                      }
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Your Role</label>
                    <input
                      type="text"
                      value={proj.role}
                      onChange={(e) =>
                        onChange({
                          ...data,
                          projects: data.projects.map((p) => (p.id === proj.id ? { ...p, role: e.target.value } : p)),
                        })
                      }
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Tech Stack (comma separated)</label>
                  <input
                    type="text"
                    value={proj.techStack.join(', ')}
                    onChange={(e) =>
                      onChange({
                        ...data,
                        projects: data.projects.map((p) =>
                          p.id === proj.id
                            ? {
                                ...p,
                                techStack: e.target.value
                                  .split(',')
                                  .map((s) => s.trim())
                                  .filter(Boolean),
                              }
                            : p
                        ),
                      })
                    }
                    placeholder="React, TypeScript, Vercel"
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Live URL (Vercel / Demo)</label>
                    <input
                      type="url"
                      value={proj.liveUrl}
                      onChange={(e) =>
                        onChange({
                          ...data,
                          projects: data.projects.map((p) => (p.id === proj.id ? { ...p, liveUrl: e.target.value } : p)),
                        })
                      }
                      placeholder="https://myapp.vercel.app"
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">GitHub Repo URL</label>
                    <input
                      type="url"
                      value={proj.repoUrl}
                      onChange={(e) =>
                        onChange({
                          ...data,
                          projects: data.projects.map((p) => (p.id === proj.id ? { ...p, repoUrl: e.target.value } : p)),
                        })
                      }
                      placeholder="https://github.com/user/repo"
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Portfolio Summary</label>
                  <textarea
                    rows={2}
                    value={proj.summary}
                    onChange={(e) =>
                      onChange({
                        ...data,
                        projects: data.projects.map((p) => (p.id === proj.id ? { ...p, summary: e.target.value } : p)),
                      })
                    }
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Resume Bullet Points (one per line)</label>
                  <textarea
                    rows={3}
                    value={proj.highlights.join('\n')}
                    onChange={(e) =>
                      onChange({
                        ...data,
                        projects: data.projects.map((p) =>
                          p.id === proj.id
                            ? {
                                ...p,
                                highlights: e.target.value.split('\n').filter((line) => line.trim() !== ''),
                              }
                            : p
                        ),
                      })
                    }
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
                  />
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <label className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    Upload Project Screenshot
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleProjectCoverUpload(proj.id, file);
                      }}
                    />
                  </label>
                  {proj.coverImage && (
                    <span className="text-[11px] text-slate-500">Cover ready</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 4: EDUCATION, EXPERIENCE, SKILLS & ACHIEVEMENTS */}
        {activeTab === 'background' && (
          <div className="space-y-6">
            {/* Education */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">Education</h3>
                <button
                  type="button"
                  onClick={addEducation}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-slate-900 text-white rounded-md hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  Add
                </button>
              </div>
              {data.education.map((edu) => (
                <div key={edu.id} className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2.5">
                  <div className="flex justify-between gap-2">
                    <input
                      type="text"
                      value={edu.institution}
                      placeholder="University / College / Bootcamp"
                      onChange={(e) =>
                        onChange({
                          ...data,
                          education: data.education.map((x) => (x.id === edu.id ? { ...x, institution: e.target.value } : x)),
                        })
                      }
                      className="flex-1 px-2.5 py-1.5 text-xs font-medium border border-slate-200 rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => onChange({ ...data, education: data.education.filter((x) => x.id !== edu.id) })}
                      className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={edu.degree}
                    placeholder="Degree (e.g. B.Tech in Computer Science)"
                    onChange={(e) =>
                      onChange({
                        ...data,
                        education: data.education.map((x) => (x.id === edu.id ? { ...x, degree: e.target.value } : x)),
                      })
                    }
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={edu.startYear}
                      placeholder="Start"
                      onChange={(e) =>
                        onChange({
                          ...data,
                          education: data.education.map((x) => (x.id === edu.id ? { ...x, startYear: e.target.value } : x)),
                        })
                      }
                      className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
                    />
                    <input
                      type="text"
                      value={edu.endYear}
                      placeholder="End / Expected"
                      onChange={(e) =>
                        onChange({
                          ...data,
                          education: data.education.map((x) => (x.id === edu.id ? { ...x, endYear: e.target.value } : x)),
                        })
                      }
                      className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
                    />
                    <input
                      type="text"
                      value={edu.gpa}
                      placeholder="GPA"
                      onChange={(e) =>
                        onChange({
                          ...data,
                          education: data.education.map((x) => (x.id === edu.id ? { ...x, gpa: e.target.value } : x)),
                        })
                      }
                      className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
                    />
                  </div>
                  <input
                    type="text"
                    value={edu.coursework}
                    placeholder="Relevant Coursework (DSA, DBMS, OS...)"
                    onChange={(e) =>
                      onChange({
                        ...data,
                        education: data.education.map((x) => (x.id === edu.id ? { ...x, coursework: e.target.value } : x)),
                      })
                    }
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
                  />
                </div>
              ))}
            </section>

            {/* Experience & Hackathons */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">Experience & Hackathons</h3>
                <button
                  type="button"
                  onClick={addExperience}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-slate-900 text-white rounded-md hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  Add
                </button>
              </div>
              {data.experience.map((exp) => (
                <div key={exp.id} className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2.5">
                  <div className="flex justify-between gap-2">
                    <input
                      type="text"
                      value={exp.role}
                      placeholder="Role (e.g. Frontend Intern / Hackathon Lead)"
                      onChange={(e) =>
                        onChange({
                          ...data,
                          experience: data.experience.map((x) => (x.id === exp.id ? { ...x, role: e.target.value } : x)),
                        })
                      }
                      className="flex-1 px-2.5 py-1.5 text-xs font-medium border border-slate-200 rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => onChange({ ...data, experience: data.experience.filter((x) => x.id !== exp.id) })}
                      className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={exp.organization}
                      placeholder="Organization / Event"
                      onChange={(e) =>
                        onChange({
                          ...data,
                          experience: data.experience.map((x) =>
                            x.id === exp.id ? { ...x, organization: e.target.value } : x
                          ),
                        })
                      }
                      className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
                    />
                    <input
                      type="text"
                      value={exp.period}
                      placeholder="Dates (e.g. Summer 2025)"
                      onChange={(e) =>
                        onChange({
                          ...data,
                          experience: data.experience.map((x) => (x.id === exp.id ? { ...x, period: e.target.value } : x)),
                        })
                      }
                      className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
                    />
                  </div>
                  <textarea
                    rows={2}
                    value={exp.highlights.join('\n')}
                    placeholder="Key contributions (one per line)"
                    onChange={(e) =>
                      onChange({
                        ...data,
                        experience: data.experience.map((x) =>
                          x.id === exp.id
                            ? { ...x, highlights: e.target.value.split('\n').filter((l) => l.trim() !== '') }
                            : x
                        ),
                      })
                    }
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
                  />
                </div>
              ))}
            </section>

            {/* Skills */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">Technical Skills</h3>
                <button
                  type="button"
                  onClick={addSkillGroup}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-slate-900 text-white rounded-md hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  Add Group
                </button>
              </div>
              {data.skills.map((grp) => (
                <div key={grp.id} className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                  <div className="flex justify-between gap-2">
                    <input
                      type="text"
                      value={grp.category}
                      placeholder="Category (e.g. Languages)"
                      onChange={(e) =>
                        onChange({
                          ...data,
                          skills: data.skills.map((s) => (s.id === grp.id ? { ...s, category: e.target.value } : s)),
                        })
                      }
                      className="flex-1 px-2.5 py-1.5 text-xs font-medium border border-slate-200 rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => onChange({ ...data, skills: data.skills.filter((s) => s.id !== grp.id) })}
                      className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={grp.items.join(', ')}
                    placeholder="TypeScript, Python, C++, React"
                    onChange={(e) =>
                      onChange({
                        ...data,
                        skills: data.skills.map((s) =>
                          s.id === grp.id
                            ? {
                                ...s,
                                items: e.target.value
                                  .split(',')
                                  .map((i) => i.trim())
                                  .filter(Boolean),
                              }
                            : s
                        ),
                      })
                    }
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
                  />
                </div>
              ))}
            </section>

            {/* Achievements */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">Coding Badges & Achievements</h3>
                <button
                  type="button"
                  onClick={addAchievement}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-slate-900 text-white rounded-md hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  Add
                </button>
              </div>
              {data.achievements.map((ach) => (
                <div key={ach.id} className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                  <div className="flex justify-between gap-2">
                    <input
                      type="text"
                      value={ach.title}
                      placeholder="Milestone (e.g. 3-Star CodeChef / AWS Certified)"
                      onChange={(e) =>
                        onChange({
                          ...data,
                          achievements: data.achievements.map((a) =>
                            a.id === ach.id ? { ...a, title: e.target.value } : a
                          ),
                        })
                      }
                      className="flex-1 px-2.5 py-1.5 text-xs font-medium border border-slate-200 rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => onChange({ ...data, achievements: data.achievements.filter((a) => a.id !== ach.id) })}
                      className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={ach.issuer}
                      placeholder="Platform / Issuer"
                      onChange={(e) =>
                        onChange({
                          ...data,
                          achievements: data.achievements.map((a) =>
                            a.id === ach.id ? { ...a, issuer: e.target.value } : a
                          ),
                        })
                      }
                      className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
                    />
                    <input
                      type="text"
                      value={ach.date}
                      placeholder="Year"
                      onChange={(e) =>
                        onChange({
                          ...data,
                          achievements: data.achievements.map((a) =>
                            a.id === ach.id ? { ...a, date: e.target.value } : a
                          ),
                        })
                      }
                      className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
                    />
                  </div>
                  <input
                    type="text"
                    value={ach.detail}
                    placeholder="Short detail"
                    onChange={(e) =>
                      onChange({
                        ...data,
                        achievements: data.achievements.map((a) =>
                          a.id === ach.id ? { ...a, detail: e.target.value } : a
                        ),
                      })
                    }
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
                  />
                </div>
              ))}
            </section>
          </div>
        )}
      </div>
    </div>
  );
};
