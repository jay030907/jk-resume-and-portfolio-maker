'use client';

import React from 'react';
import { AccentColor, FontStyleId, PortfolioData, ResumeTemplate } from '../types/portfolio';
import { sanitizeUrl } from '../utils/exportHtml';
import { getFontConfig } from '../utils/themeStyles';

interface ResumePreviewProps {
  data: PortfolioData;
  template: ResumeTemplate;
  accentColor?: AccentColor;
  fontStyle?: FontStyleId;
}

const ACCENT_LINK_MAP: Record<AccentColor, string> = {
  blue: 'text-blue-700',
  emerald: 'text-emerald-700',
  rose: 'text-rose-700',
  amber: 'text-amber-700',
  slate: 'text-slate-800',
};

export const ResumePreview: React.FC<ResumePreviewProps> = ({
  data,
  template,
  accentColor = 'blue',
  fontStyle = 'jakarta',
}) => {
  const { profile, accounts, education, projects, experience, skills, achievements, customSections = [] } = data;
  const activeAccounts = accounts.filter((a) => a.enabled && (a.username.trim() || a.url.trim()));
  const showPhoto = profile.showPhotoOnResume && Boolean(profile.photoDataUrl);
  const accentText = ACCENT_LINK_MAP[accentColor] || ACCENT_LINK_MAP.blue;
  const fontCfg = getFontConfig(fontStyle);

  if (template === 'modern') {
    return (
      <div
        className="print-only-sheet bg-white text-slate-900 w-full max-w-[820px] mx-auto border border-slate-200 shadow-sm rounded-lg overflow-hidden"
        style={{ fontFamily: fontCfg.bodyStack }}
      >
        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] min-h-[1040px]">
          {/* Left Structural Column */}
          <aside className="bg-slate-50 border-r border-slate-200 p-7 space-y-6">
            {showPhoto && (
              <div className="w-28 h-28 rounded-xl overflow-hidden border border-slate-200 bg-white">
                <img
                  src={sanitizeUrl(profile.photoDataUrl, true)}
                  alt={profile.fullName || 'Profile'}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <h2 className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">Contact</h2>
              <div className="text-xs text-slate-700 space-y-1 break-words">
                {profile.email && (
                  <div>
                    <a href={`mailto:${profile.email}`} className="hover:text-blue-600 underline decoration-slate-300">
                      {profile.email}
                    </a>
                  </div>
                )}
                {profile.phone && <div className="tabular-nums">{profile.phone}</div>}
                {profile.location && <div>{profile.location}</div>}
              </div>
            </div>

            {activeAccounts.length > 0 && (
              <div className="space-y-2 pt-4 border-t border-slate-200">
                <h2 className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                  Coding & Profiles
                </h2>
                <div className="space-y-2.5">
                  {activeAccounts.map((acc) => (
                    <div key={acc.id} className="text-xs">
                      <a
                        href={sanitizeUrl(acc.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-slate-900 hover:text-blue-600"
                      >
                        {acc.label}
                      </a>
                      <div className="text-[11px] text-slate-600 font-mono-tabular truncate">
                        {acc.username || acc.url}
                      </div>
                      {acc.statText && <div className="text-[11px] text-slate-500 mt-0.5">{acc.statText}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {skills.length > 0 && (
              <div className="space-y-2.5 pt-4 border-t border-slate-200">
                <h2 className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">Skills</h2>
                <div className="space-y-2.5">
                  {skills.map((grp) => (
                    <div key={grp.id} className="text-xs">
                      <div className="font-semibold text-slate-900">{grp.category}</div>
                      <div className="text-slate-600 leading-relaxed mt-0.5">{grp.items.join(' · ')}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {achievements.length > 0 && (
              <div className="space-y-2.5 pt-4 border-t border-slate-200">
                <h2 className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">Achievements</h2>
                <div className="space-y-2">
                  {achievements.map((ach) => (
                    <div key={ach.id} className="text-xs">
                      <div className="font-semibold text-slate-900">{ach.title}</div>
                      <div className="text-[11px] text-slate-500">
                        {[ach.issuer, ach.date].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* Main Right Content */}
          <main className="p-8 space-y-6">
            <header className="pb-5 border-b border-slate-200">
              <h1
                className="text-2xl font-bold tracking-tight text-slate-900"
                style={{ fontFamily: fontCfg.headingStack }}
              >
                {profile.fullName || 'Your Name'}
              </h1>
              {profile.headline && <p className={`text-sm font-medium mt-1 ${accentText}`}>{profile.headline}</p>}
              {profile.summary && (
                <p className="text-[13px] text-slate-700 leading-relaxed mt-3">{profile.summary}</p>
              )}
            </header>

            {education.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Education</h2>
                {education.map((edu) => (
                  <div key={edu.id} className="space-y-1">
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="text-sm font-semibold text-slate-900">{edu.institution}</span>
                      <span className="text-xs text-slate-500 tabular-nums shrink-0">
                        {[edu.startYear, edu.endYear].filter(Boolean).join(' – ')}
                      </span>
                    </div>
                    <div className="text-xs text-slate-700">
                      {edu.degree}
                      {edu.gpa ? ` · GPA ${edu.gpa}` : ''}
                    </div>
                    {edu.coursework && (
                      <div className="text-xs text-slate-500">Coursework: {edu.coursework}</div>
                    )}
                  </div>
                ))}
              </section>
            )}

            {projects.length > 0 && (
              <section className="space-y-4 pt-2 border-t border-slate-100">
                <h2 className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Projects</h2>
                <div className="space-y-4">
                  {projects.map((proj) => (
                    <div key={proj.id} className="space-y-1.5">
                      <div className="flex items-baseline justify-between gap-3 flex-wrap">
                        <h3 className="text-sm font-semibold text-slate-900">{proj.title}</h3>
                        <div className="flex items-center gap-3 text-xs font-medium text-blue-700">
                          {proj.liveUrl && (
                            <a href={sanitizeUrl(proj.liveUrl)} target="_blank" rel="noopener noreferrer" className="hover:underline">
                              Live Demo
                            </a>
                          )}
                          {proj.repoUrl && (
                            <a href={sanitizeUrl(proj.repoUrl)} target="_blank" rel="noopener noreferrer" className="hover:underline">
                              GitHub
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-slate-500">
                        {[proj.role, proj.techStack.join(' · ')].filter(Boolean).join(' / ')}
                      </div>
                      <ul className="list-disc pl-4 space-y-1 text-[13px] text-slate-700 leading-snug">
                        {proj.highlights.map((h, i) => (
                          <li key={i}>{h}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {experience.length > 0 && (
              <section className="space-y-4 pt-2 border-t border-slate-100">
                <h2 className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                  Experience & Hackathons
                </h2>
                <div className="space-y-4">
                  {experience.map((exp) => (
                    <div key={exp.id} className="space-y-1">
                      <div className="flex items-baseline justify-between gap-4">
                        <h3 className="text-sm font-semibold text-slate-900">{exp.role}</h3>
                        <span className="text-xs text-slate-500 tabular-nums shrink-0">{exp.period}</span>
                      </div>
                      <div className="text-xs text-slate-600">
                        {[exp.organization, exp.type, exp.location].filter(Boolean).join(' · ')}
                      </div>
                      <ul className="list-disc pl-4 space-y-1 text-[13px] text-slate-700 leading-snug pt-0.5">
                        {exp.highlights.map((h, i) => (
                          <li key={i}>{h}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            )}
            {customSections.map((sec) => (
              <section key={sec.id} className="space-y-2.5 pt-2 border-t border-slate-100">
                <h2 className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                  {sec.title}
                </h2>
                <div className="space-y-2">
                  {sec.entries.map((entry, i) => (
                    <div key={i} className="text-[13px]">
                      <span className="font-semibold text-slate-900">{entry.heading}</span>
                      {entry.subheading && <span className="text-slate-600"> · {entry.subheading}</span>}
                      {entry.detail && <p className="text-xs text-slate-600 mt-0.5">{entry.detail}</p>}
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </main>
        </div>
      </div>
    );
  }

  // Classic ATS Editorial Single-Column Template
  return (
    <div
      className="print-only-sheet bg-white text-slate-900 w-full max-w-[820px] mx-auto border border-slate-200 shadow-sm rounded-lg p-9 md:p-11 space-y-5 min-h-[1040px]"
      style={{ fontFamily: fontCfg.bodyStack }}
    >
      {/* Header */}
      <header className="flex items-start justify-between gap-6 pb-4 border-b border-slate-300">
        <div className="space-y-1.5 flex-1">
          <h1
            className="text-3xl font-bold tracking-tight text-slate-900"
            style={{ fontFamily: fontCfg.headingStack }}
          >
            {profile.fullName || 'Your Full Name'}
          </h1>
          {profile.headline && <p className="text-sm font-medium text-slate-700">{profile.headline}</p>}
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-600 pt-1">
            {profile.email && (
              <a href={`mailto:${profile.email}`} className="hover:text-blue-700 underline decoration-slate-300">
                {profile.email}
              </a>
            )}
            {profile.phone && (
              <>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">{profile.phone}</span>
              </>
            )}
            {profile.location && (
              <>
                <span aria-hidden="true">·</span>
                <span>{profile.location}</span>
              </>
            )}
          </div>
          {activeAccounts.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-700 pt-0.5">
              {activeAccounts.map((acc, idx) => (
                <React.Fragment key={acc.id}>
                  {idx > 0 && <span aria-hidden="true" className="text-slate-300">/</span>}
                  <a
                    href={sanitizeUrl(acc.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-blue-700 font-medium"
                  >
                    {acc.label}: <span className="font-mono-tabular font-normal text-slate-600">{acc.username || acc.url}</span>
                  </a>
                </React.Fragment>
              ))}
            </div>
          )}
        </div>

        {showPhoto && (
          <div className="w-20 h-20 rounded-lg overflow-hidden border border-slate-200 shrink-0">
            <img
              src={sanitizeUrl(profile.photoDataUrl, true)}
              alt={profile.fullName || 'Profile'}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </header>

      {/* Summary */}
      {profile.summary && (
        <section className="space-y-1">
          <h2 className="text-xs font-bold tracking-wider text-slate-900 uppercase border-b border-slate-200 pb-1">
            Summary
          </h2>
          <p className="text-[13px] text-slate-700 leading-relaxed pt-1">{profile.summary}</p>
        </section>
      )}

      {/* Education */}
      {education.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-bold tracking-wider text-slate-900 uppercase border-b border-slate-200 pb-1">
            Education
          </h2>
          {education.map((edu) => (
            <div key={edu.id} className="pt-0.5">
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-[13px] font-semibold text-slate-900">
                  {edu.institution} — <span className="font-normal">{edu.degree}</span>
                </span>
                <span className="text-xs text-slate-600 tabular-nums shrink-0">
                  {[edu.startYear, edu.endYear].filter(Boolean).join(' – ')}
                </span>
              </div>
              <div className="text-xs text-slate-600">
                {[edu.gpa ? `GPA: ${edu.gpa}` : '', edu.coursework ? `Coursework: ${edu.coursework}` : '']
                  .filter(Boolean)
                  .join(' · ')}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <section className="space-y-1.5">
          <h2 className="text-xs font-bold tracking-wider text-slate-900 uppercase border-b border-slate-200 pb-1">
            Technical Skills
          </h2>
          <div className="space-y-1 pt-0.5">
            {skills.map((grp) => (
              <div key={grp.id} className="text-[13px] text-slate-700">
                <span className="font-semibold text-slate-900">{grp.category}: </span>
                <span>{grp.items.join(', ')}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-bold tracking-wider text-slate-900 uppercase border-b border-slate-200 pb-1">
            Projects
          </h2>
          {projects.map((proj) => (
            <div key={proj.id} className="space-y-1">
              <div className="flex items-baseline justify-between gap-4 flex-wrap">
                <div className="text-[13px]">
                  <span className="font-semibold text-slate-900">{proj.title}</span>
                  {proj.techStack.length > 0 && (
                    <span className="text-slate-500"> · {proj.techStack.join(', ')}</span>
                  )}
                </div>
                <div className="flex items-center gap-2.5 text-xs text-blue-700 font-medium">
                  {proj.liveUrl && (
                    <a href={sanitizeUrl(proj.liveUrl)} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      Live
                    </a>
                  )}
                  {proj.repoUrl && (
                    <a href={sanitizeUrl(proj.repoUrl)} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      Code
                    </a>
                  )}
                </div>
              </div>
              <ul className="list-disc pl-4 space-y-0.5 text-[13px] text-slate-700 leading-snug">
                {proj.highlights.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {/* Experience & Hackathons */}
      {experience.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-bold tracking-wider text-slate-900 uppercase border-b border-slate-200 pb-1">
            Experience & Activities
          </h2>
          {experience.map((exp) => (
            <div key={exp.id} className="space-y-1">
              <div className="flex items-baseline justify-between gap-4">
                <div className="text-[13px]">
                  <span className="font-semibold text-slate-900">{exp.role}</span>
                  {exp.organization && <span className="text-slate-700"> — {exp.organization}</span>}
                </div>
                <span className="text-xs text-slate-600 tabular-nums shrink-0">{exp.period}</span>
              </div>
              <ul className="list-disc pl-4 space-y-0.5 text-[13px] text-slate-700 leading-snug">
                {exp.highlights.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {/* Coding Profiles & Achievements */}
      {(achievements.length > 0 || activeAccounts.some((a) => a.statText)) && (
        <section className="space-y-1.5">
          <h2 className="text-xs font-bold tracking-wider text-slate-900 uppercase border-b border-slate-200 pb-1">
            Coding Profiles & Achievements
          </h2>
          <ul className="list-disc pl-4 space-y-1 text-[13px] text-slate-700 pt-0.5">
            {activeAccounts
              .filter((a) => a.statText)
              .map((acc) => (
                <li key={acc.id}>
                  <span className="font-semibold text-slate-900">{acc.label}: </span>
                  <span>{acc.statText}</span>
                </li>
              ))}
            {achievements.map((ach) => (
              <li key={ach.id}>
                <span className="font-semibold text-slate-900">{ach.title}</span>
                {ach.issuer ? ` (${ach.issuer}${ach.date ? `, ${ach.date}` : ''})` : ''}
                {ach.detail ? ` — ${ach.detail}` : ''}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Custom Sections */}
      {customSections.map((sec) => (
        <section key={sec.id} className="space-y-1.5">
          <h2 className="text-xs font-bold tracking-wider text-slate-900 uppercase border-b border-slate-200 pb-1">
            {sec.title}
          </h2>
          <ul className="list-disc pl-4 space-y-1 text-[13px] text-slate-700 pt-0.5">
            {sec.entries.map((entry, i) => (
              <li key={i}>
                <span className="font-semibold text-slate-900">{entry.heading}</span>
                {entry.subheading ? ` (${entry.subheading})` : ''}
                {entry.detail ? ` — ${entry.detail}` : ''}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
};
