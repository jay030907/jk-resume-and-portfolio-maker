'use client';

import React, { useEffect, useState } from 'react';
import { ArrowUpRight, Mail, X } from 'lucide-react';
import {
  AccentColor,
  FontStyleId,
  PortfolioData,
  PortfolioTheme,
  ProjectItem,
  WallpaperPreset,
} from '../types/portfolio';
import { PlatformIcon } from './PlatformIcon';
import { sanitizeUrl } from '../utils/exportHtml';
import { getFontConfig, getPortfolioWallpaperStyle } from '../utils/themeStyles';

interface PortfolioPreviewProps {
  data: PortfolioData;
  theme: PortfolioTheme;
  accentColor?: AccentColor;
  wallpaper?: WallpaperPreset;
  customWallpaperUrl?: string;
  fontStyle?: FontStyleId;
}

const LIGHT_ACCENT_BTN: Record<AccentColor, string> = {
  blue: 'bg-blue-600 text-white hover:bg-blue-700',
  emerald: 'bg-emerald-600 text-white hover:bg-emerald-700',
  rose: 'bg-rose-600 text-white hover:bg-rose-700',
  amber: 'bg-amber-600 text-white hover:bg-amber-700',
  slate: 'bg-slate-900 text-white hover:bg-slate-800',
};

const ACCENT_TEXT: Record<AccentColor, string> = {
  blue: 'text-blue-600',
  emerald: 'text-emerald-600',
  rose: 'text-rose-600',
  amber: 'text-amber-600',
  slate: 'text-slate-700',
};

export const PortfolioPreview: React.FC<PortfolioPreviewProps> = ({
  data,
  theme,
  accentColor = 'blue',
  wallpaper = 'clean',
  customWallpaperUrl,
  fontStyle = 'jakarta',
}) => {
  const { profile, accounts, projects, experience, education, skills, achievements, customSections = [] } = data;
  const activeAccounts = accounts.filter((a) => a.enabled && (a.username.trim() || a.url.trim()));
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedProject(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const isDark = theme === 'monograph';
  const isPaper = theme === 'paper';

  const shellClass = isDark
    ? 'bg-[#050505] text-zinc-100 border-zinc-800'
    : isPaper
      ? 'bg-[#FAF8F5] text-stone-900 border-stone-200'
      : 'bg-white text-slate-900 border-slate-200';

  const surfaceClass = isDark
    ? 'bg-[#111114]/90 border-zinc-800 backdrop-blur-[2px]'
    : isPaper
      ? 'bg-[#F3EFEA]/90 border-stone-200 backdrop-blur-[2px]'
      : 'bg-slate-50/90 border-slate-200 backdrop-blur-[2px]';

  const borderClass = isDark ? 'border-zinc-800' : isPaper ? 'border-stone-200' : 'border-slate-200';
  const mutedClass = isDark ? 'text-zinc-400' : isPaper ? 'text-stone-600' : 'text-slate-600';
  const accentTextClass = isDark ? 'text-blue-400' : ACCENT_TEXT[accentColor];
  const primaryBtnClass = isDark
    ? 'bg-zinc-100 text-zinc-950 hover:bg-white'
    : LIGHT_ACCENT_BTN[accentColor];

  const fontCfg = getFontConfig(fontStyle);
  const wallpaperStyle = getPortfolioWallpaperStyle(theme, wallpaper, customWallpaperUrl, accentColor);

  return (
    <div
      className={`w-full max-w-[1120px] mx-auto border rounded-xl overflow-hidden shadow-sm ${shellClass}`}
      style={{ ...wallpaperStyle, fontFamily: fontCfg.bodyStack }}
    >
      {/* 3-Zone Top Bar Contract */}
      <header className={`flex items-center justify-between gap-8 px-6 md:px-10 py-5 border-b ${borderClass}`}>
        <span
          className="text-lg font-bold tracking-tight whitespace-nowrap shrink-0"
          style={{ fontFamily: fontCfg.headingStack }}
        >
          {profile.fullName || 'Developer Portfolio'}
        </span>

        <nav className={`hidden md:flex items-center gap-6 text-sm font-medium ${mutedClass}`}>
          <a href="#portfolio-profiles" className="hover:underline underline-offset-4 whitespace-nowrap shrink-0">
            Profiles
          </a>
          <a href="#portfolio-projects" className="hover:underline underline-offset-4 whitespace-nowrap shrink-0">
            Projects
          </a>
          <a href="#portfolio-background" className="hover:underline underline-offset-4 whitespace-nowrap shrink-0">
            Experience
          </a>
          <a href="#portfolio-skills" className="hover:underline underline-offset-4 whitespace-nowrap shrink-0">
            Capabilities
          </a>
        </nav>

        <a
          href={profile.email ? `mailto:${profile.email}` : '#portfolio-contact'}
          className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${primaryBtnClass}`}
        >
          <Mail className="w-3.5 h-3.5" />
          Email Me
        </a>
      </header>

      {/* Split-Screen Hero */}
      <section className="px-6 md:px-10 py-12 md:py-16 grid grid-cols-1 lg:grid-cols-[1.35fr_0.85fr] gap-10 items-stretch">
        <div className="flex flex-col justify-center space-y-5">
          <div className={`text-xs font-medium ${mutedClass}`}>
            {[profile.headline, profile.location, profile.availability].filter(Boolean).join(' · ') ||
              'Aspiring Software Engineer'}
          </div>

          <h1
            className="text-3xl md:text-5xl font-bold tracking-tight leading-[1.1]"
            style={{ textWrap: 'balance', fontFamily: fontCfg.headingStack }}
          >
            {profile.portfolioTagline ||
              profile.headline ||
              'Building thoughtful software, one shipped project at a time.'}
          </h1>

          <p className={`text-base leading-relaxed max-w-2xl ${mutedClass}`}>
            {profile.summary ||
              'Add your background, projects, and linked coding platforms in the editor to build your personal portfolio.'}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {profile.email && (
              <a
                href={`mailto:${profile.email}`}
                className={`inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${primaryBtnClass}`}
              >
                Get in Touch
                <ArrowUpRight className="w-4 h-4" />
              </a>
            )}
            {activeAccounts[0] && (
              <a
                href={sanitizeUrl(activeAccounts[0].url)}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 ${borderClass}`}
              >
                <PlatformIcon platform={activeAccounts[0].platform} className="w-4 h-4" />
                {activeAccounts[0].label}
              </a>
            )}
          </div>
        </div>

        {/* Right Portrait Container */}
        <div className="flex lg:justify-end">
          <div
            className={`w-full max-w-[340px] aspect-square lg:h-full lg:max-h-[360px] rounded-2xl border overflow-hidden ${surfaceClass}`}
          >
            {profile.photoDataUrl ? (
              <img
                src={sanitizeUrl(profile.photoDataUrl, true)}
                alt={profile.fullName || 'Portrait'}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                <span className="font-editorial text-5xl font-semibold opacity-40">
                  {(profile.fullName || 'F').slice(0, 1).toUpperCase()}
                </span>
                <span className={`text-xs mt-2 ${mutedClass}`}>Upload a profile photo in Identity</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Full-Width Linked Accounts & Coding Footprint Strip */}
      {activeAccounts.length > 0 && (
        <section id="portfolio-profiles" className={`px-6 md:px-10 py-8 border-t border-b ${borderClass}`}>
          <div className="flex items-baseline justify-between gap-4 mb-5">
            <h2 className="text-sm font-semibold tracking-tight">Connected Coding & Builder Profiles</h2>
            <span className={`text-xs tabular-nums ${mutedClass}`}>{activeAccounts.length} linked accounts</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {activeAccounts.map((acc) => (
              <a
                key={acc.id}
                href={sanitizeUrl(acc.url)}
                target="_blank"
                rel="noopener noreferrer"
                className={`group p-4 rounded-xl border transition-colors flex items-start justify-between gap-3 ${surfaceClass} hover:border-blue-500`}
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <PlatformIcon platform={acc.platform} className="w-4 h-4 shrink-0" />
                    <span className="text-sm font-semibold truncate">{acc.label}</span>
                  </div>
                  <div className={`text-xs font-mono-tabular truncate ${mutedClass}`}>
                    {acc.username || acc.url}
                  </div>
                  {acc.statText && (
                    <div className="text-xs font-medium text-blue-600 dark:text-blue-400 pt-0.5">{acc.statText}</div>
                  )}
                </div>
                <ArrowUpRight className={`w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${mutedClass}`} />
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Selected Projects Showcase */}
      {projects.length > 0 && (
        <section id="portfolio-projects" className={`px-6 md:px-10 py-12 border-b ${borderClass}`}>
          <div className="flex items-baseline justify-between gap-4 mb-8">
            <h2 className="text-2xl font-bold tracking-tight">Selected Projects</h2>
            <span className={`text-xs tabular-nums ${mutedClass}`}>Click a project for case study</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.map((proj) => (
              <article
                key={proj.id}
                className={`rounded-2xl border overflow-hidden flex flex-col ${surfaceClass}`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedProject(proj)}
                  className="aspect-[4/3] w-full overflow-hidden border-b border-inherit text-left cursor-pointer group relative"
                >
                  {proj.coverImage ? (
                    <img
                      src={sanitizeUrl(proj.coverImage, true)}
                      alt={proj.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-6">
                      <span className="font-editorial text-xl font-semibold opacity-60">{proj.title}</span>
                    </div>
                  )}
                </button>

                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className={`text-xs ${mutedClass}`}>
                      {[proj.role, proj.techStack.join(' · ')].filter(Boolean).join(' / ')}
                    </div>
                    <h3 className="text-lg font-semibold tracking-tight">
                      <button
                        type="button"
                        onClick={() => setSelectedProject(proj)}
                        className="text-left hover:underline underline-offset-4 cursor-pointer"
                      >
                        {proj.title}
                      </button>
                    </h3>
                    <p className={`text-sm leading-relaxed ${mutedClass}`}>{proj.summary}</p>
                  </div>

                  <div className="flex items-center gap-4 pt-2 text-xs font-semibold">
                    {proj.liveUrl && (
                      <a
                        href={sanitizeUrl(proj.liveUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-1 hover:underline ${accentTextClass}`}
                      >
                        Live Site
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {proj.repoUrl && (
                      <a
                        href={sanitizeUrl(proj.repoUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-1 hover:underline ${mutedClass}`}
                      >
                        GitHub Repo
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Experience & Education */}
      {(experience.length > 0 || education.length > 0) && (
        <section id="portfolio-background" className={`px-6 md:px-10 py-12 border-b ${borderClass}`}>
          <h2 className="text-2xl font-bold tracking-tight mb-8">Experience & Education</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {experience.map((exp) => (
              <div key={exp.id} className={`p-6 rounded-2xl border space-y-2.5 ${surfaceClass}`}>
                <div className={`text-xs tabular-nums ${mutedClass}`}>
                  {[exp.type, exp.period, exp.location].filter(Boolean).join(' · ')}
                </div>
                <h3 className="text-base font-semibold">{exp.role}</h3>
                <div className="text-sm font-medium">{exp.organization}</div>
                <ul className={`list-disc pl-4 space-y-1.5 text-sm ${mutedClass}`}>
                  {exp.highlights.map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
              </div>
            ))}

            {education.map((edu) => (
              <div key={edu.id} className={`p-6 rounded-2xl border space-y-2 ${surfaceClass}`}>
                <div className={`text-xs tabular-nums ${mutedClass}`}>
                  {[edu.startYear, edu.endYear].filter(Boolean).join(' – ')}
                  {edu.gpa ? ` · GPA ${edu.gpa}` : ''}
                </div>
                <h3 className="text-base font-semibold">{edu.degree}</h3>
                <div className="text-sm font-medium">{edu.institution}</div>
                {edu.coursework && <p className={`text-sm pt-1 ${mutedClass}`}>Coursework: {edu.coursework}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills & Achievements */}
      {(skills.length > 0 || achievements.length > 0) && (
        <section id="portfolio-skills" className={`px-6 md:px-10 py-12 border-b ${borderClass}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {skills.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold tracking-tight">Technical Stack</h2>
                <div className="space-y-3">
                  {skills.map((grp) => (
                    <div key={grp.id} className={`pb-3 border-b last:border-b-0 ${borderClass}`}>
                      <div className="text-sm font-semibold">{grp.category}</div>
                      <div className={`text-sm mt-1 ${mutedClass}`}>{grp.items.join(' · ')}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {achievements.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold tracking-tight">Achievements & Certifications</h2>
                <div className="space-y-3">
                  {achievements.map((ach) => (
                    <div key={ach.id} className={`pb-3 border-b last:border-b-0 ${borderClass}`}>
                      <div className="text-sm font-semibold">{ach.title}</div>
                      <div className={`text-xs tabular-nums mt-0.5 ${mutedClass}`}>
                        {[ach.issuer, ach.date].filter(Boolean).join(' · ')}
                      </div>
                      {ach.detail && <div className={`text-sm mt-1 ${mutedClass}`}>{ach.detail}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Custom Sections */}
      {customSections.length > 0 && (
        <section className={`px-6 md:px-10 py-12 border-b ${borderClass} space-y-8`}>
          {customSections.map((sec) => (
            <div key={sec.id} className="space-y-4">
              <h2 className="text-xl font-bold tracking-tight">{sec.title}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sec.entries.map((entry, idx) => (
                  <div key={idx} className={`p-5 rounded-xl border space-y-1 ${surfaceClass}`}>
                    <div className="text-sm font-semibold">{entry.heading}</div>
                    {entry.subheading && <div className={`text-xs ${mutedClass}`}>{entry.subheading}</div>}
                    {entry.detail && <div className={`text-sm pt-1 ${mutedClass}`}>{entry.detail}</div>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Clean Footer */}
      <footer id="portfolio-contact" className="px-6 md:px-10 py-8 flex flex-wrap items-center justify-between gap-4 text-xs">
        <span className={mutedClass}>
          {profile.fullName || 'Portfolio'}
          {profile.location ? ` · ${profile.location}` : ''}
        </span>
        <div className="flex items-center gap-4">
          {profile.email && (
            <a href={`mailto:${profile.email}`} className="hover:underline font-medium">
              {profile.email}
            </a>
          )}
        </div>
      </footer>

      {/* Project Case-Study Modal */}
      {selectedProject && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setSelectedProject(null)}
        >
          <div
            className={`w-full max-w-2xl rounded-2xl border overflow-hidden shadow-xl ${shellClass}`}
            onClick={(e) => e.stopPropagation()}
          >
            {selectedProject.coverImage && (
              <div className="aspect-[16/9] w-full overflow-hidden border-b border-inherit">
                <img
                  src={sanitizeUrl(selectedProject.coverImage, true)}
                  alt={selectedProject.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className={`text-xs ${mutedClass}`}>
                    {[selectedProject.role, selectedProject.techStack.join(' · ')].filter(Boolean).join(' / ')}
                  </div>
                  <h3 className="text-xl font-bold mt-1">{selectedProject.title}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedProject(null)}
                  aria-label="Close modal"
                  className={`p-2 rounded-lg border ${borderClass} cursor-pointer`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className={`text-sm leading-relaxed ${mutedClass}`}>{selectedProject.summary}</p>
              {selectedProject.highlights.length > 0 && (
                <ul className={`list-disc pl-5 space-y-1.5 text-sm ${mutedClass}`}>
                  {selectedProject.highlights.map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
              )}
              <div className="flex items-center gap-3 pt-2">
                {selectedProject.liveUrl && (
                  <a
                    href={sanitizeUrl(selectedProject.liveUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg ${primaryBtnClass}`}
                  >
                    Open Live Deployment
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                )}
                {selectedProject.repoUrl && (
                  <a
                    href={sanitizeUrl(selectedProject.repoUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg border ${borderClass}`}
                  >
                    View GitHub Source
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
