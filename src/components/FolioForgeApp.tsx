'use client';

import React, { useEffect, useState } from 'react';
import {
  Download,
  Maximize2,
  Minimize2,
  Printer,
  RotateCcw,
  FileCode2,
  Palette,
  X,
} from 'lucide-react';
import {
  FontStyleId,
  PortfolioData,
  UIPreferences,
} from '../types/portfolio';
import {
  DEFAULT_PORTFOLIO_DATA,
  DEFAULT_UI_PREFERENCES,
  EMPTY_PORTFOLIO_DATA,
  FONT_STYLE_OPTIONS,
} from '../data/presets';
import { BuilderSidebar, BuilderTab } from './BuilderSidebar';
import { ResumePreview } from './ResumePreview';
import { PortfolioPreview } from './PortfolioPreview';
import { buildStandalonePortfolioHtml } from '../utils/exportHtml';
import { loadWorkspaceState, saveWorkspaceState } from '../utils/storage';

export default function FolioForgeApp() {
  const [data, setData] = useState<PortfolioData>(DEFAULT_PORTFOLIO_DATA);
  const [uiPreferences, setUiPreferences] = useState<UIPreferences>(DEFAULT_UI_PREFERENCES);
  const [hydrated, setHydrated] = useState(false);

  const [builderTab, setBuilderTab] = useState<BuilderTab>('identity');
  const [isFullscreenPreview, setIsFullscreenPreview] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    let active = true;
    loadWorkspaceState()
      .then((saved) => {
        if (!active || !saved) return;
        setData(saved.data);
        setUiPreferences({
          ...DEFAULT_UI_PREFERENCES,
          ...saved.ui,
          showPhotoOnResume: saved.data.profile.showPhotoOnResume,
        });
      })
      .finally(() => {
        if (active) setHydrated(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    void saveWorkspaceState({ data, ui: uiPreferences });
  }, [data, uiPreferences, hydrated]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowExportModal(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handlePrintResume = () => {
    if (uiPreferences.previewMode !== 'resume') {
      setUiPreferences((prev) => ({ ...prev, previewMode: 'resume' }));
      setTimeout(() => window.print(), 120);
    } else {
      window.print();
    }
  };

  const handleDownloadPortfolioHtml = () => {
    const html = buildStandalonePortfolioHtml(
      data,
      uiPreferences.portfolioTheme,
      uiPreferences.accentColor,
      uiPreferences.wallpaper,
      uiPreferences.customWallpaperUrl,
      uiPreferences.fontStyle
    );
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const slug = (data.profile.fullName || 'portfolio')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-');
    a.href = url;
    a.download = `${slug}-portfolio.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJson = () => {
    const blob = new Blob([JSON.stringify({ data, uiPreferences }, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'folioforge-profile.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] text-slate-900">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="no-print h-16 px-6 bg-white border-b border-slate-200 flex items-center justify-between gap-8 shrink-0">
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setIsFullscreenPreview(false);
          }}
          className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
        >
          FolioForge
        </a>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button
            type="button"
            onClick={() => {
              setIsFullscreenPreview(false);
              setBuilderTab('identity');
            }}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              !isFullscreenPreview && builderTab === 'identity'
                ? 'text-slate-900 underline underline-offset-8'
                : ''
            }`}
          >
            Identity
          </button>
          <button
            type="button"
            onClick={() => {
              setIsFullscreenPreview(false);
              setBuilderTab('projects');
            }}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              !isFullscreenPreview && builderTab === 'projects'
                ? 'text-slate-900 underline underline-offset-8'
                : ''
            }`}
          >
            Projects
          </button>
          <button
            type="button"
            onClick={() => setUiPreferences((prev) => ({ ...prev, previewMode: 'resume' }))}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              uiPreferences.previewMode === 'resume'
                ? 'text-slate-900 underline underline-offset-8'
                : ''
            }`}
          >
            Resume
          </button>
          <button
            type="button"
            onClick={() => setUiPreferences((prev) => ({ ...prev, previewMode: 'portfolio' }))}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              uiPreferences.previewMode === 'portfolio'
                ? 'text-slate-900 underline underline-offset-8'
                : ''
            }`}
          >
            Portfolio
          </button>
        </nav>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => setShowExportModal(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Export
          </button>
        </div>
      </header>

      {/* Main Split Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* Left Guided Editor Column */}
        {!isFullscreenPreview && (
          <aside className="no-print w-full lg:w-[440px] xl:w-[470px] border-b lg:border-b-0 lg:border-r border-slate-200 bg-[#F8F9FA] flex flex-col h-[560px] lg:h-[calc(100vh-4rem)] shrink-0">
            <BuilderSidebar
              data={data}
              uiPreferences={uiPreferences}
              onChange={setData}
              onUiChange={setUiPreferences}
              activeTab={builderTab}
              onTabChange={setBuilderTab}
            />
          </aside>
        )}

        {/* Right Preview Stage */}
        <main className="flex-1 flex flex-col min-w-0 lg:h-[calc(100vh-4rem)]">
          {/* Workspace Preview Toolbar */}
          <div className="no-print px-5 py-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Output Toggle */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() =>
                    setUiPreferences((prev) => ({ ...prev, previewMode: 'resume' }))
                  }
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    uiPreferences.previewMode === 'resume'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Resume (ATS)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setUiPreferences((prev) => ({ ...prev, previewMode: 'portfolio' }))
                  }
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    uiPreferences.previewMode === 'portfolio'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Portfolio Website
                </button>
              </div>

              {/* Template / Theme Switcher */}
              {uiPreferences.previewMode === 'resume' ? (
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                  <button
                    type="button"
                    onClick={() =>
                      setUiPreferences((prev) => ({ ...prev, resumeTemplate: 'classic' }))
                    }
                    className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      uiPreferences.resumeTemplate === 'classic'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Classic
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setUiPreferences((prev) => ({ ...prev, resumeTemplate: 'modern' }))
                    }
                    className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      uiPreferences.resumeTemplate === 'modern'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Modern Split
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                  {(
                    [
                      { id: 'editorial', label: 'Editorial Light' },
                      { id: 'monograph', label: 'Monograph Dark' },
                      { id: 'paper', label: 'Studio Paper' },
                    ] as const
                  ).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() =>
                        setUiPreferences((prev) => ({ ...prev, portfolioTheme: t.id }))
                      }
                      className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        uiPreferences.portfolioTheme === t.id
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Quick Alphabet / Font Style Selector */}
              <select
                aria-label="Alphabet style"
                value={uiPreferences.fontStyle}
                onChange={(e) =>
                  setUiPreferences((prev) => ({
                    ...prev,
                    fontStyle: e.target.value as FontStyleId,
                  }))
                }
                className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 cursor-pointer"
              >
                {FONT_STYLE_OPTIONS.map((f) => (
                  <option key={f.id} value={f.id}>
                    Font: {f.label}
                  </option>
                ))}
              </select>

              {/* Quick Jump to Wallpaper & Style Tab */}
              <button
                type="button"
                onClick={() => {
                  setIsFullscreenPreview(false);
                  setBuilderTab('style');
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Palette className="w-3.5 h-3.5" />
                Wallpapers
              </button>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {uiPreferences.previewMode === 'resume' ? (
                <button
                  type="button"
                  onClick={handlePrintResume}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print / PDF
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleDownloadPortfolioHtml}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <FileCode2 className="w-3.5 h-3.5" />
                  Download HTML
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsFullscreenPreview((v) => !v)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
                title={isFullscreenPreview ? 'Show Editor' : 'Fullscreen Preview'}
              >
                {isFullscreenPreview ? (
                  <>
                    <Minimize2 className="w-3.5 h-3.5" />
                    Show Editor
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3.5 h-3.5" />
                    Expand
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Scrollable Preview Canvas */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#F1F3F5]">
            {uiPreferences.previewMode === 'resume' ? (
              <ResumePreview
                data={data}
                template={uiPreferences.resumeTemplate}
                accentColor={uiPreferences.accentColor}
                fontStyle={uiPreferences.fontStyle}
              />
            ) : (
              <PortfolioPreview
                data={data}
                theme={uiPreferences.portfolioTheme}
                accentColor={uiPreferences.accentColor}
                wallpaper={uiPreferences.wallpaper}
                customWallpaperUrl={uiPreferences.customWallpaperUrl}
                fontStyle={uiPreferences.fontStyle}
              />
            )}
          </div>
        </main>
      </div>

      {/* Export & Workspace Data Modal */}
      {showExportModal && (
        <div
          className="no-print fixed inset-0 z-50 bg-slate-950/50 flex items-center justify-center p-4"
          onClick={() => setShowExportModal(false)}
        >
          <div
            className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Export & Workspace Tools</h2>
                <p className="text-xs text-slate-600 mt-1">
                  Download your ATS resume as PDF, export a ready-to-deploy HTML portfolio with your chosen wallpaper and font style, or reset your workspace.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg cursor-pointer"
                aria-label="Close export modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  setShowExportModal(false);
                  handlePrintResume();
                }}
                className="w-full flex items-center justify-between px-4 py-3 text-left border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div>
                  <div className="text-sm font-semibold text-slate-900">Save Resume as PDF</div>
                  <div className="text-xs text-slate-500">Opens clean A4 print dialog with clickable links</div>
                </div>
                <Printer className="w-4 h-4 text-slate-600 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => {
                  handleDownloadPortfolioHtml();
                  setShowExportModal(false);
                }}
                className="w-full flex items-center justify-between px-4 py-3 text-left border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div>
                  <div className="text-sm font-semibold text-slate-900">Download Portfolio Website (.html)</div>
                  <div className="text-xs text-slate-500">Self-contained site ready for Vercel or GitHub Pages</div>
                </div>
                <FileCode2 className="w-4 h-4 text-slate-600 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => {
                  handleDownloadJson();
                  setShowExportModal(false);
                }}
                className="w-full flex items-center justify-between px-4 py-3 text-left border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div>
                  <div className="text-sm font-semibold text-slate-900">Backup Profile Data (.json)</div>
                  <div className="text-xs text-slate-500">Save your details, projects, and linked accounts locally</div>
                </div>
                <Download className="w-4 h-4 text-slate-600 shrink-0" />
              </button>
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setData(DEFAULT_PORTFOLIO_DATA);
                  setShowExportModal(false);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Load Beginner Sample
              </button>
              <button
                type="button"
                onClick={() => {
                  setData(EMPTY_PORTFOLIO_DATA);
                  setBuilderTab('identity');
                  setShowExportModal(false);
                }}
                className="px-3 py-2 text-xs font-medium text-rose-700 border border-rose-200 rounded-lg hover:bg-rose-50 cursor-pointer"
              >
                Start From Blank
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
