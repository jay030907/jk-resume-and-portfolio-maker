import {
  AccentColor,
  FontStyleId,
  PortfolioData,
  PortfolioTheme,
  WallpaperPreset,
} from '../types/portfolio';
import { buildWallpaperCssRule, getFontConfig } from './themeStyles';

function escapeHtml(value: string): string {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function sanitizeUrl(url: string, allowDataImage = false): string {
  const trimmed = String(url || '').trim();
  if (!trimmed) return '#';
  if (allowDataImage && /^data:image\/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=]+$/i.test(trimmed)) {
    return trimmed;
  }
  if (/^(https?:\/\/|mailto:|\/images\/|\/src\/assets\/)/i.test(trimmed)) {
    return trimmed;
  }
  return '#';
}

const ACCENT_HEX: Record<AccentColor, { light: string; dark: string }> = {
  blue: { light: '#2563EB', dark: '#60A5FA' },
  emerald: { light: '#059669', dark: '#34D399' },
  rose: { light: '#E11D48', dark: '#FB7185' },
  amber: { light: '#D97706', dark: '#FBBF24' },
  slate: { light: '#0F172A', dark: '#94A3B8' },
};

export function buildStandalonePortfolioHtml(
  data: PortfolioData,
  theme: PortfolioTheme,
  accentColor: AccentColor = 'blue',
  wallpaper: WallpaperPreset = 'clean',
  customWallpaperUrl?: string,
  fontStyle: FontStyleId = 'jakarta'
): string {
  const { profile, accounts, projects, experience, education, skills, achievements, customSections = [] } = data;
  const activeAccounts = accounts.filter((a) => a.enabled && (a.url.trim() || a.username.trim()));

  const isDark = theme === 'monograph';
  const isPaper = theme === 'paper';

  const bg = isDark ? '#0A0A0C' : isPaper ? '#FAF8F5' : '#FFFFFF';
  const surface = isDark ? 'rgba(20, 20, 24, 0.92)' : isPaper ? 'rgba(243, 239, 234, 0.92)' : 'rgba(248, 250, 252, 0.92)';
  const border = isDark ? '#27272A' : '#E2E8F0';
  const textPrimary = isDark ? '#F8FAFC' : '#0F172A';
  const textSecondary = isDark ? '#A1A1AA' : '#475569';
  const accentSet = ACCENT_HEX[accentColor] || ACCENT_HEX.blue;
  const accent = isDark ? accentSet.dark : accentSet.light;
  const fontCfg = getFontConfig(fontStyle);
  const wallpaperCss = buildWallpaperCssRule(theme, wallpaper, customWallpaperUrl, accentColor);

  const photoHtml = profile.photoDataUrl
    ? `<img src="${escapeHtml(sanitizeUrl(profile.photoDataUrl, true))}" alt="${escapeHtml(profile.fullName)}" style="width:100%;height:100%;object-fit:cover;border-radius:16px;" />`
    : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:48px;font-weight:700;color:${textSecondary};background:${surface};border-radius:16px;">${escapeHtml(
        (profile.fullName || 'U').slice(0, 1).toUpperCase()
      )}</div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(profile.fullName || 'Developer Portfolio')} — Portfolio</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Manrope:wght@400;500;600;700&family=Outfit:wght@400;500;600;700&family=Playfair+Display:wght@500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Source+Serif+4:wght@400;600;700&display=swap" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: ${fontCfg.bodyStack};
      background-color: ${bg};
      ${wallpaperCss}
      color: ${textPrimary};
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
      min-height: 100vh;
    }
    h1, h2, h3 { font-family: ${fontCfg.headingStack}; }
    a { color: inherit; text-decoration: none; }
    .container { max-width: 1120px; margin: 0 auto; padding: 0 24px; }
    header {
      border-bottom: 1px solid ${border};
      padding: 20px 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 24px;
    }
    .nav { display: flex; gap: 24px; font-size: 14px; color: ${textSecondary}; }
    .nav a:hover { color: ${textPrimary}; }
    .cta {
      background: ${accent};
      color: #ffffff;
      padding: 10px 18px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      white-space: nowrap;
    }
    .hero {
      display: grid;
      grid-template-columns: 1.4fr 0.8fr;
      gap: 48px;
      align-items: center;
      padding: 72px 0 56px;
    }
    .hero h1 { font-size: clamp(32px, 4.5vw, 52px); line-height: 1.1; letter-spacing: -0.02em; margin-bottom: 16px; }
    .hero p { color: ${textSecondary}; font-size: 17px; max-width: 60ch; margin-bottom: 24px; }
    .avatar-box { aspect-ratio: 1 / 1; max-width: 340px; width: 100%; justify-self: end; border: 1px solid ${border}; border-radius: 16px; overflow: hidden; }
    .accounts-strip {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      padding: 28px 0;
      border-top: 1px solid ${border};
      border-bottom: 1px solid ${border};
    }
    .account-card {
      padding: 16px;
      border: 1px solid ${border};
      background: ${surface};
      border-radius: 12px;
      display: block;
    }
    .account-card:hover { border-color: ${accent}; }
    .section { padding: 64px 0; border-bottom: 1px solid ${border}; }
    .section h2 { font-size: 26px; letter-spacing: -0.015em; margin-bottom: 28px; }
    .grid-2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 24px; }
    .card {
      border: 1px solid ${border};
      background: ${surface};
      border-radius: 14px;
      padding: 24px;
    }
    .muted { color: ${textSecondary}; font-size: 14px; }
    .mono { font-family: 'JetBrains Mono', monospace; font-size: 13px; font-variant-numeric: tabular-nums; }
    ul { padding-left: 18px; margin-top: 12px; color: ${textSecondary}; font-size: 14px; }
    li { margin-bottom: 6px; }
    footer { padding: 48px 0; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 16px; color: ${textSecondary}; font-size: 14px; }
    @media (max-width: 820px) {
      .hero { grid-template-columns: 1fr; }
      .avatar-box { justify-self: start; max-width: 240px; }
      .nav { display: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <strong style="font-size:18px;font-family:${escapeHtml(fontCfg.headingStack)};">${escapeHtml(profile.fullName || 'Portfolio')}</strong>
      <nav class="nav">
        <a href="#profiles">Profiles</a>
        <a href="#projects">Projects</a>
        <a href="#experience">Experience</a>
        <a href="#skills">Skills</a>
      </nav>
      <a class="cta" href="mailto:${escapeHtml(profile.email || '')}">Email Me</a>
    </header>

    <section class="hero">
      <div>
        <div class="muted" style="margin-bottom:12px;">${escapeHtml(
          [profile.headline, profile.location, profile.availability].filter(Boolean).join(' · ')
        )}</div>
        <h1>${escapeHtml(profile.portfolioTagline || profile.headline || profile.fullName)}</h1>
        <p>${escapeHtml(profile.summary)}</p>
        <div style="display:flex;gap:12px;flex-wrap:wrap;">
          ${profile.email ? `<a class="cta" href="mailto:${escapeHtml(profile.email)}">Get in Touch</a>` : ''}
          ${
            activeAccounts[0]
              ? `<a style="padding:10px 18px;border:1px solid ${border};border-radius:8px;font-size:14px;font-weight:600;" href="${escapeHtml(
                  sanitizeUrl(activeAccounts[0].url)
                )}" target="_blank" rel="noopener noreferrer">View ${escapeHtml(activeAccounts[0].label)}</a>`
              : ''
          }
        </div>
      </div>
      <div class="avatar-box">${photoHtml}</div>
    </section>

    <section id="profiles" class="accounts-strip">
      ${activeAccounts
        .map(
          (acc) => `
        <a class="account-card" href="${escapeHtml(sanitizeUrl(acc.url))}" target="_blank" rel="noopener noreferrer">
          <div style="font-weight:600;font-size:15px;">${escapeHtml(acc.label)}</div>
          <div class="mono muted" style="margin-top:4px;">${escapeHtml(acc.username || acc.url)}</div>
          ${acc.statText ? `<div style="margin-top:8px;font-size:13px;color:${accent};font-weight:500;">${escapeHtml(acc.statText)}</div>` : ''}
        </a>`
        )
        .join('')}
    </section>

    ${
      projects.length > 0
        ? `<section id="projects" class="section">
      <h2>Selected Projects</h2>
      <div class="grid-2">
        ${projects
          .map(
            (proj) => `
          <article class="card">
            <div class="muted" style="margin-bottom:6px;">${escapeHtml(
              [proj.role, proj.techStack.join(' · ')].filter(Boolean).join(' / ')
            )}</div>
            <h3 style="font-size:19px;margin-bottom:10px;">${escapeHtml(proj.title)}</h3>
            <p class="muted">${escapeHtml(proj.summary)}</p>
            ${
              proj.highlights.length > 0
                ? `<ul>${proj.highlights.map((h) => `<li>${escapeHtml(h)}</li>`).join('')}</ul>`
                : ''
            }
            <div style="display:flex;gap:16px;margin-top:16px;font-size:13px;font-weight:600;color:${accent};">
              ${proj.liveUrl ? `<a href="${escapeHtml(sanitizeUrl(proj.liveUrl))}" target="_blank" rel="noopener noreferrer">Live Demo →</a>` : ''}
              ${proj.repoUrl ? `<a href="${escapeHtml(sanitizeUrl(proj.repoUrl))}" target="_blank" rel="noopener noreferrer">Source Code →</a>` : ''}
            </div>
          </article>`
          )
          .join('')}
      </div>
    </section>`
        : ''
    }

    ${
      experience.length > 0 || education.length > 0
        ? `<section id="experience" class="section">
      <h2>Experience & Education</h2>
      <div class="grid-2">
        ${experience
          .map(
            (exp) => `
          <div class="card">
            <div class="muted">${escapeHtml([exp.type, exp.period, exp.location].filter(Boolean).join(' · '))}</div>
            <h3 style="font-size:18px;margin-top:6px;">${escapeHtml(exp.role)}</h3>
            <div style="font-weight:600;font-size:14px;margin-top:2px;">${escapeHtml(exp.organization)}</div>
            ${
              exp.highlights.length > 0
                ? `<ul>${exp.highlights.map((h) => `<li>${escapeHtml(h)}</li>`).join('')}</ul>`
                : ''
            }
          </div>`
          )
          .join('')}
        ${education
          .map(
            (edu) => `
          <div class="card">
            <div class="muted">${escapeHtml([edu.startYear, edu.endYear].filter(Boolean).join(' – '))}${edu.gpa ? ` · GPA ${escapeHtml(edu.gpa)}` : ''}</div>
            <h3 style="font-size:18px;margin-top:6px;">${escapeHtml(edu.degree)}</h3>
            <div style="font-weight:600;font-size:14px;margin-top:2px;">${escapeHtml(edu.institution)}</div>
            ${edu.coursework ? `<p class="muted" style="margin-top:10px;">Coursework: ${escapeHtml(edu.coursework)}</p>` : ''}
          </div>`
          )
          .join('')}
      </div>
    </section>`
        : ''
    }

    ${
      skills.length > 0 || achievements.length > 0
        ? `<section id="skills" class="section">
      <h2>Technical Capabilities & Milestones</h2>
      <div class="grid-2">
        <div class="card">
          <h3 style="font-size:17px;margin-bottom:14px;">Skills</h3>
          ${skills
            .map(
              (group) => `
            <div style="margin-bottom:12px;">
              <div style="font-weight:600;font-size:14px;">${escapeHtml(group.category)}</div>
              <div class="muted">${escapeHtml(group.items.join(' · '))}</div>
            </div>`
            )
            .join('')}
        </div>
        ${
          achievements.length > 0
            ? `<div class="card">
          <h3 style="font-size:17px;margin-bottom:14px;">Achievements</h3>
          ${achievements
            .map(
              (ach) => `
            <div style="margin-bottom:14px;">
              <div style="font-weight:600;font-size:14px;">${escapeHtml(ach.title)}</div>
              <div class="muted">${escapeHtml([ach.issuer, ach.date].filter(Boolean).join(' · '))}</div>
              <div class="muted" style="margin-top:2px;">${escapeHtml(ach.detail)}</div>
            </div>`
            )
            .join('')}
        </div>`
            : ''
        }
      </div>
    </section>`
        : ''
    }

    ${
      customSections.length > 0
        ? customSections
            .map(
              (sec) => `<section class="section">
      <h2>${escapeHtml(sec.title)}</h2>
      <div class="grid-2">
        ${sec.entries
          .map(
            (entry) => `<div class="card">
          <div style="font-weight:600;font-size:15px;">${escapeHtml(entry.heading)}</div>
          ${entry.subheading ? `<div class="muted" style="margin-top:2px;">${escapeHtml(entry.subheading)}</div>` : ''}
          ${entry.detail ? `<p class="muted" style="margin-top:8px;">${escapeHtml(entry.detail)}</p>` : ''}
        </div>`
          )
          .join('')}
      </div>
    </section>`
            )
            .join('')
        : ''
    }

    <footer>
      <span>${escapeHtml(profile.fullName || '')}${profile.location ? ` · ${escapeHtml(profile.location)}` : ''}</span>
      <span>${profile.email ? `<a href="mailto:${escapeHtml(profile.email)}">${escapeHtml(profile.email)}</a>` : ''}</span>
    </footer>
  </div>
</body>
</html>`;
}
