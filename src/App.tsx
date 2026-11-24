import React, { useEffect, useState } from 'react';
import {
  Download,
  Maximize2,
  Minimize2,
  Printer,
  RotateCcw,
  Sparkles,
  SlidersHorizontal,
  FileCode2,
  X,
} from 'lucide-react';
import {
  AccentColor,
  AIChatMessage,
  AIGenerationInput,
  PortfolioData,
  PortfolioTheme,
  PreviewMode,
  ResumeTemplate,
  UIPreferences,
  WorkspaceSnapshot,
} from './types/portfolio';
import { DEFAULT_PORTFOLIO_DATA, EMPTY_PORTFOLIO_DATA } from './data/presets';
import { BuilderSidebar, BuilderTab } from './components/BuilderSidebar';
import { AIModePanel } from './components/AIModePanel';
import { ResumePreview } from './components/ResumePreview';
import { PortfolioPreview } from './components/PortfolioPreview';
import { buildStandalonePortfolioHtml } from './utils/exportHtml';

const STORAGE_KEY = 'folioforge_portfolio_v1';

type LeftMode = 'builder' | 'ai';

export default function App() {
  const [data, setData] = useState<PortfolioData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved) as PortfolioData;
    } catch {
      // Ignore storage read errors
    }
    return DEFAULT_PORTFOLIO_DATA;
  });

  const [leftMode, setLeftMode] = useState<LeftMode>('ai');
  const [builderTab, setBuilderTab] = useState<BuilderTab>('identity');
  const [previewMode, setPreviewMode] = useState<PreviewMode>('resume');
  const [resumeTemplate, setResumeTemplate] = useState<ResumeTemplate>('classic');
  const [portfolioTheme, setPortfolioTheme] = useState<PortfolioTheme>('editorial');
  const [accentColor, setAccentColor] = useState<AccentColor>('blue');
  const [isFullscreenPreview, setIsFullscreenPreview] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [aiMessages, setAiMessages] = useState<AIChatMessage[]>([]);

  const [aiInput, setAiInput] = useState<AIGenerationInput>({
    rawNotes: '',
    targetRole: 'Software Engineering Intern',
    tone: 'ATS Concise',
    jobDescription: '',
    includeCodingStats: true,
  });

  const currentUiPreferences: UIPreferences = {
    previewMode,
    resumeTemplate,
    portfolioTheme,
    showPhotoOnResume: data.profile.showPhotoOnResume,
    accentColor,
  };

  const applyWorkspaceSnapshot = (snapshot: WorkspaceSnapshot) => {
    setData({
      ...snapshot.data,
      profile: {
        ...snapshot.data.profile,
        showPhotoOnResume: snapshot.ui.showPhotoOnResume,
      },
    });
    setPreviewMode(snapshot.ui.previewMode);
    setResumeTemplate(snapshot.ui.resumeTemplate);
    setPortfolioTheme(snapshot.ui.portfolioTheme);
    if (snapshot.ui.accentColor) {
      setAccentColor(snapshot.ui.accentColor);
    }
  };

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Ignore storage quota errors when large photos are uploaded
    }
  }, [data]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowExportModal(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handlePrintResume = () => {
    if (previewMode !== 'resume') {
      setPreviewMode('resume');
      setTimeout(() => window.print(), 120);
    } else {
      window.print();
    }
  };

  const handleDownloadPortfolioHtml = () => {
    const html = buildStandalonePortfolioHtml(data, portfolioTheme, accentColor);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const slug = (data.profile.fullName || 'portfolio').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    a.href = url;
    a.download = `${slug}-portfolio.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
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
              setLeftMode('ai');
            }}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              !isFullscreenPreview && leftMode === 'ai' ? 'text-slate-900 underline underline-offset-8' : ''
            }`}
          >
            AI Mode
          </button>
          <button
            type="button"
            onClick={() => {
              setIsFullscreenPreview(false);
              setLeftMode('builder');
            }}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              !isFullscreenPreview && leftMode === 'builder' ? 'text-slate-900 underline underline-offset-8' : ''
            }`}
          >
            Details & Links
          </button>
          <button
            type="button"
            onClick={() => setPreviewMode('resume')}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              previewMode === 'resume' ? 'text-slate-900 underline underline-offset-8' : ''
            }`}
          >
            Resume
          </button>
          <button
            type="button"
            onClick={() => setPreviewMode('portfolio')}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              previewMode === 'portfolio' ? 'text-slate-900 underline underline-offset-8' : ''
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
        {/* Left Editor / AI Studio Column */}
        {!isFullscreenPreview && (
          <aside className="no-print w-full lg:w-[440px] xl:w-[470px] border-b lg:border-b-0 lg:border-r border-slate-200 bg-[#F8F9FA] flex flex-col h-[540px] lg:h-[calc(100vh-4rem)] shrink-0">
            {/* Workspace Mode Switcher */}
            <div className="px-4 pt-4 pb-0">
              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-200/70 rounded-xl">
                <button
                  type="button"
                  onClick={() => setLeftMode('ai')}
                  className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    leftMode === 'ai'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  AI Mode
                </button>
                <button
                  type="button"
                  onClick={() => setLeftMode('builder')}
                  className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    leftMode === 'builder'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  Guided Details
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-0">
              {leftMode === 'builder' ? (
                <BuilderSidebar
                  data={data}
                  onChange={setData}
                  activeTab={builderTab}
                  onTabChange={setBuilderTab}
                  targetRole={aiInput.targetRole}
                />
              ) : (
                <AIModePanel
                  data={data}
                  uiPreferences={currentUiPreferences}
                  aiInput={aiInput}
                  messages={aiMessages}
                  onMessagesChange={setAiMessages}
                  onAiInputChange={setAiInput}
                  onApplySnapshot={applyWorkspaceSnapshot}
                  onPhotoUpload={(photoDataUrl) =>
                    setData((prev) => ({
                      ...prev,
                      profile: { ...prev.profile, photoDataUrl },
                    }))
                  }
                  onSwitchToManualTab={() => {
                    setLeftMode('builder');
                    setBuilderTab('links');
                  }}
                />
              )}
            </div>
          </aside>
        )}

        {/* Right Preview Stage */}
        <main className="flex-1 flex flex-col min-w-0 lg:h-[calc(100vh-4rem)]">
          {/* Workspace Preview Toolbar */}
          <div className="no-print px-5 py-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Output Toggle */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setPreviewMode('resume')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    previewMode === 'resume'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Resume (ATS)
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode('portfolio')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    previewMode === 'portfolio'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Portfolio Website
                </button>
              </div>

              {/* Template / Theme Switcher */}
              {previewMode === 'resume' ? (
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setResumeTemplate('classic')}
                    className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      resumeTemplate === 'classic'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Classic
                  </button>
                  <button
                    type="button"
                    onClick={() => setResumeTemplate('modern')}
                    className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      resumeTemplate === 'modern'
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
                      onClick={() => setPortfolioTheme(t.id)}
                      className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        portfolioTheme === t.id
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {previewMode === 'resume' ? (
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
                    Show AI & Editor
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
            {previewMode === 'resume' ? (
              <ResumePreview data={data} template={resumeTemplate} accentColor={accentColor} />
            ) : (
              <PortfolioPreview data={data} theme={portfolioTheme} accentColor={accentColor} />
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
                  Download your ATS resume as PDF, export a ready-to-deploy HTML portfolio for Vercel or GitHub Pages, or reset your workspace.
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
                  <div className="text-xs text-slate-500">Save your details and linked accounts locally</div>
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
                  setLeftMode('ai');
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
