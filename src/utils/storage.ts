import { PortfolioData, UIPreferences } from '../types/portfolio';
import { DEFAULT_PORTFOLIO_DATA, DEFAULT_UI_PREFERENCES } from '../data/presets';

const DB_NAME = 'folioforge_workspace_db';
const STORE_NAME = 'workspace';
const DB_KEY = 'active_state';
const LEGACY_LOCAL_KEY = 'folioforge_portfolio_v1';
const UI_LOCAL_KEY = 'folioforge_ui_v2';

export interface PersistedWorkspace {
  data: PortfolioData;
  ui: UIPreferences;
}

function migrateLegacyImagePaths(parsed: PortfolioData): PortfolioData {
  const fixPath = (val?: string) =>
    val && val.startsWith('/src/assets/images/')
      ? val.replace('/src/assets/images/', '/images/')
      : val || '';

  return {
    ...DEFAULT_PORTFOLIO_DATA,
    ...parsed,
    profile: {
      ...DEFAULT_PORTFOLIO_DATA.profile,
      ...parsed.profile,
      photoDataUrl: fixPath(parsed.profile?.photoDataUrl),
    },
    projects: Array.isArray(parsed.projects)
      ? parsed.projects.map((p) => ({
          ...p,
          coverImage: fixPath(p.coverImage),
        }))
      : [],
    customSections: Array.isArray(parsed.customSections) ? parsed.customSections : [],
  };
}

function openWorkspaceDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('IndexedDB open failed'));
  });
}

export async function loadWorkspaceState(): Promise<PersistedWorkspace | null> {
  try {
    const db = await openWorkspaceDb();
    const record = await new Promise<PersistedWorkspace | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(DB_KEY);
      req.onsuccess = () => resolve(req.result as PersistedWorkspace | undefined);
      req.onerror = () => reject(req.error);
    });
    db.close();

    if (record && record.data) {
      return {
        data: migrateLegacyImagePaths(record.data),
        ui: { ...DEFAULT_UI_PREFERENCES, ...(record.ui || {}) },
      };
    }
  } catch {
    // Fallback to localStorage below
  }

  try {
    const legacyRaw = window.localStorage.getItem(LEGACY_LOCAL_KEY);
    const uiRaw = window.localStorage.getItem(UI_LOCAL_KEY);
    if (legacyRaw) {
      const parsedData = JSON.parse(legacyRaw) as PortfolioData;
      const parsedUi = uiRaw ? (JSON.parse(uiRaw) as Partial<UIPreferences>) : {};
      return {
        data: migrateLegacyImagePaths(parsedData),
        ui: { ...DEFAULT_UI_PREFERENCES, ...parsedUi },
      };
    }
  } catch {
    // Ignore storage read errors
  }

  return null;
}

export async function saveWorkspaceState(state: PersistedWorkspace): Promise<void> {
  try {
    const db = await openWorkspaceDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(state, DB_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // Best-effort fallback to localStorage if IndexedDB is blocked
    try {
      window.localStorage.setItem(LEGACY_LOCAL_KEY, JSON.stringify(state.data));
    } catch {
      // Ignore quota errors
    }
  }

  try {
    const { customWallpaperUrl: _skipLargeImg, ...lightUi } = state.ui;
    window.localStorage.setItem(UI_LOCAL_KEY, JSON.stringify(lightUi));
  } catch {
    // Ignore
  }
}
