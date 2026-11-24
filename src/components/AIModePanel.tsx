import React, { useEffect, useRef, useState } from 'react';
import {
  Send,
  RotateCcw,
  Sliders,
  AlertCircle,
  Undo2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Upload,
} from 'lucide-react';
import {
  AIChatMessage,
  AIGenerationInput,
  AIInstructResponse,
  PortfolioData,
  UIPreferences,
  WorkspaceSnapshot,
} from '../types/portfolio';
import { SAMPLE_PROJECT_COVER_ONE, SAMPLE_PROJECT_COVER_TWO } from '../data/presets';

interface AIModePanelProps {
  data: PortfolioData;
  uiPreferences: UIPreferences;
  aiInput: AIGenerationInput;
  messages: AIChatMessage[];
  onMessagesChange: React.Dispatch<React.SetStateAction<AIChatMessage[]>>;
  onAiInputChange: (next: AIGenerationInput) => void;
  onApplySnapshot: (snapshot: WorkspaceSnapshot) => void;
  onPhotoUpload: (dataUrl: string) => void;
  onSwitchToManualTab: () => void;
}

const TARGET_ROLES = [
  'Software Engineering Intern',
  'Frontend / React Developer',
  'Full-Stack Developer (Fresher)',
  'Competitive Programmer & Backend Intern',
  'Data Science & ML Beginner',
];

const TONES: AIGenerationInput['tone'][] = [
  'ATS Concise',
  'Storytelling & Builder',
  'Competitive & Technical',
];

const STARTER_INSTRUCTIONS = [
  'Build a complete beginner resume and portfolio for a CS student targeting 2026 internships using all my linked accounts',
  'Add a new full-stack project called DevBoard built with React, TypeScript, and Node.js deployed on Vercel',
  'Improve my summary and rewrite all project bullets with strong action verbs for ATS',
  'Switch the portfolio to Monograph Dark and hide my profile photo on the resume',
];

const QUICK_COMMANDS = [
  { label: 'Polish All Bullets', prompt: 'Rewrite my summary and all project and experience bullet points to be concise and ATS-ready.' },
  { label: 'Add Vercel Project', prompt: 'Add a new beginner-friendly web project deployed on Vercel with GitHub repo link and 3 crisp resume bullets.' },
  { label: 'Dark Portfolio', prompt: 'Switch my portfolio website preview to Monograph Dark theme.' },
  { label: 'Modern Resume', prompt: 'Switch my resume template to Modern Split layout.' },
];

function resizePhoto(file: File, maxSize = 480): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image file.'));
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

export const AIModePanel: React.FC<AIModePanelProps> = ({
  data,
  uiPreferences,
  aiInput,
  messages,
  onMessagesChange,
  onAiInputChange,
  onApplySnapshot,
  onPhotoUpload,
  onSwitchToManualTab,
}) => {
  const [instruction, setInstruction] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [lastFailedText, setLastFailedText] = useState<string | null>(null);
  const threadEndRef = useRef<HTMLDivElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const activeAccounts = data.accounts.filter((a) => a.enabled && (a.username.trim() || a.url.trim()));

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  const handleQuickPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    try {
      const url = await resizePhoto(file, 520);
      onPhotoUpload(url);
    } catch {
      // Ignore invalid image
    }
  };

  const sendInstruction = async (textToSend?: string) => {
    const cleanText = (textToSend ?? instruction).trim();
    if (!cleanText || isProcessing) return;

    const snapshotBefore: WorkspaceSnapshot = {
      data: structuredClone(data),
      ui: { ...uiPreferences },
    };

    const userMsg: AIChatMessage = {
      id: `msg-u-${Date.now()}`,
      role: 'user',
      text: cleanText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    if (!textToSend) setInstruction('');
    setLastFailedText(null);
    onMessagesChange((prev) => [...prev, userMsg]);
    setIsProcessing(true);

    try {
      const historyPayload = messages.slice(-6).map((m) => ({ role: m.role, text: m.text }));

      const res = await fetch('/api/ai/instruct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instruction: cleanText,
          portfolioData: data,
          uiPreferences,
          targetRole: aiInput.targetRole,
          tone: aiInput.tone,
          jobDescription: aiInput.jobDescription,
          history: historyPayload,
        }),
      });

      const json = (await res.json()) as AIInstructResponse & { error?: string };
      if (!res.ok || !json.portfolioData) {
        throw new Error(json.error || 'AI could not process that instruction. Please try again.');
      }

      // Preserve uploaded photoDataUrl and existing project cover images by matching ID or title
      const mergedProjects = (json.portfolioData.projects || []).map((proj, index) => {
        const matchedExisting =
          data.projects.find((p) => p.id === proj.id) ||
          data.projects.find((p) => p.title.toLowerCase() === proj.title.toLowerCase());
        return {
          ...proj,
          coverImage:
            matchedExisting?.coverImage ||
            (index % 2 === 0 ? SAMPLE_PROJECT_COVER_ONE : SAMPLE_PROJECT_COVER_TWO),
        };
      });

      const nextData: PortfolioData = {
        ...json.portfolioData,
        profile: {
          ...json.portfolioData.profile,
          photoDataUrl: data.profile.photoDataUrl,
          showPhotoOnResume: json.uiPreferences.showPhotoOnResume,
        },
        projects: mergedProjects,
        customSections: json.portfolioData.customSections || [],
      };

      const nextUi: UIPreferences = {
        previewMode: json.uiPreferences.previewMode,
        resumeTemplate: json.uiPreferences.resumeTemplate,
        portfolioTheme: json.uiPreferences.portfolioTheme,
        showPhotoOnResume: json.uiPreferences.showPhotoOnResume,
        accentColor: json.uiPreferences.accentColor || uiPreferences.accentColor || 'blue',
      };

      onApplySnapshot({ data: nextData, ui: nextUi });

      const aiMsg: AIChatMessage = {
        id: `msg-a-${Date.now()}`,
        role: 'assistant',
        text: json.reply,
        changesSummary: json.changesSummary,
        snapshotBefore,
        undone: false,
        status: 'ok',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      onMessagesChange((prev) => [...prev, aiMsg]);
    } catch (err) {
      setLastFailedText(cleanText);
      const errorMsg: AIChatMessage = {
        id: `msg-err-${Date.now()}`,
        role: 'assistant',
        text: err instanceof Error ? err.message : 'Unable to apply instruction.',
        status: 'error',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      onMessagesChange((prev) => [...prev, errorMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUndoMessage = (msgId: string) => {
    const target = messages.find((m) => m.id === msgId);
    if (!target?.snapshotBefore || target.undone) return;

    onApplySnapshot(target.snapshotBefore);
    onMessagesChange((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, undone: true } : m))
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendInstruction();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Compact Context Bar */}
      <div className="px-4 py-3 bg-white border-b border-slate-200 space-y-2.5 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-xs font-semibold text-slate-900 truncate">
              AI Mode — Instruction Studio
            </div>
            <div className="text-[11px] text-slate-500 truncate tabular-nums">
              {data.profile.fullName || 'Unnamed'} · {data.profile.photoDataUrl ? 'Photo set' : 'No photo'} · {activeAccounts.length} linked accounts
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <input
              ref={photoInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleQuickPhoto}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/70 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              title="Upload profile photo"
            >
              <Upload className="w-3 h-3" />
              Photo
            </button>
            <button
              type="button"
              onClick={() => setShowOptions((v) => !v)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/70 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Sliders className="w-3 h-3" />
              Role & JD
              {showOptions ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            {messages.length > 0 && (
              <button
                type="button"
                onClick={() => onMessagesChange([])}
                title="Clear conversation"
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Collapsible Target Role, Tone & Job Description Drawer */}
        {showOptions && (
          <div className="pt-2.5 border-t border-slate-100 space-y-2.5">
            <div className="grid grid-cols-1 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Target Role</label>
                <select
                  value={aiInput.targetRole}
                  onChange={(e) => onAiInputChange({ ...aiInput, targetRole: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs font-medium border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-blue-600"
                >
                  {TARGET_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Tone</label>
                <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg">
                  {TONES.map((tone) => (
                    <button
                      key={tone}
                      type="button"
                      onClick={() => onAiInputChange({ ...aiInput, tone })}
                      className={`px-2 py-1 text-[11px] font-medium rounded-md truncate cursor-pointer ${
                        aiInput.tone === tone ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      {tone}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Target Job Description (Optional)
                </label>
                <textarea
                  rows={2}
                  value={aiInput.jobDescription}
                  onChange={(e) => onAiInputChange({ ...aiInput, jobDescription: e.target.value })}
                  placeholder="Paste internship or role requirements so AI tailors every edit..."
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={onSwitchToManualTab}
                  className="text-[11px] font-medium text-blue-600 hover:underline cursor-pointer"
                >
                  Edit linked accounts manually →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Instruction Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="space-y-4 pt-1">
            <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
              <h2 className="text-sm font-semibold text-slate-900">
                Ask AI to build, add, change, or remove anything
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tell AI Mode what you want—whether it is creating a complete beginner resume and portfolio from scratch, linking GitHub, Vercel, LeetCode, CodeChef, or HackerRank, adding custom sections, or changing themes.
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-[11px] font-medium text-slate-500 px-1">Try an instruction</div>
              {STARTER_INSTRUCTIONS.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => sendInstruction(sample)}
                  className="w-full text-left p-3 bg-white border border-slate-200 hover:border-blue-400 rounded-xl text-xs text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              {msg.role === 'user' ? (
                <div className="max-w-[88%] px-3.5 py-2.5 bg-slate-900 text-white rounded-2xl rounded-br-sm text-xs leading-relaxed">
                  {msg.text}
                </div>
              ) : msg.status === 'error' ? (
                <div className="w-full p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div className="space-y-1 flex-1">
                      <div className="font-semibold">Could not apply instruction</div>
                      <div>{msg.text}</div>
                    </div>
                  </div>
                  {idx === messages.length - 1 && lastFailedText && (
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => sendInstruction(lastFailedText)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-white border border-rose-200 text-rose-800 rounded-md hover:bg-rose-100/50 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Retry instruction
                    </button>
                  )}
                </div>
              ) : (
                <div className="w-full p-3.5 bg-white border border-slate-200 rounded-xl space-y-2.5">
                  <p className="text-xs text-slate-800 leading-relaxed">{msg.text}</p>

                  {msg.changesSummary && msg.changesSummary.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 space-y-1">
                      {msg.changesSummary.map((item, cIdx) => (
                        <div key={cIdx} className="text-[11px] text-slate-600 flex items-start gap-1.5">
                          <span aria-hidden="true" className="text-blue-600 font-semibold">·</span>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {msg.snapshotBefore && (
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-400 tabular-nums">{msg.timestamp}</span>
                      {msg.undone ? (
                        <span className="text-[11px] font-medium text-slate-500">Reverted</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleUndoMessage(msg.id)}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
                        >
                          <Undo2 className="w-3 h-3" />
                          Undo change
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}

        {isProcessing && (
          <div className="p-3.5 bg-white border border-slate-200 rounded-xl flex items-center gap-2.5 text-xs text-slate-600">
            <RotateCcw className="w-3.5 h-3.5 animate-spin text-blue-600 shrink-0" />
            <span>Implementing your instruction across resume & portfolio...</span>
          </div>
        )}

        <div ref={threadEndRef} />
      </div>

      {/* Bottom Composer */}
      <div className="p-3.5 bg-white border-t border-slate-200 space-y-2.5 shrink-0">
        {/* Quick Command Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {QUICK_COMMANDS.map((cmd) => (
            <button
              key={cmd.label}
              type="button"
              disabled={isProcessing}
              onClick={() => sendInstruction(cmd.prompt)}
              className="px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-md transition-colors whitespace-nowrap shrink-0 disabled:opacity-50 cursor-pointer"
            >
              {cmd.label}
            </button>
          ))}
        </div>

        <div className="flex items-end gap-2">
          <textarea
            rows={2}
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isProcessing}
            placeholder="Ask AI anything: add project, change skills, remove section, switch theme..."
            className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 disabled:bg-slate-50"
          />
          <button
            type="button"
            disabled={isProcessing || !instruction.trim()}
            onClick={() => sendInstruction()}
            aria-label="Send instruction"
            className="h-[54px] px-3.5 inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            Send
          </button>
        </div>
      </div>
    </div>
  );
};
