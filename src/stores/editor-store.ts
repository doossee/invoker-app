import { create } from 'zustand';
import type { RunResult } from 'ivkjs';
import type { SiteConfig } from '@/types/site-config';

export type SplitDirection = 'horizontal' | 'vertical';

export interface TabData {
  kind: 'ivk' | 'folder';
  path: string;
  name: string;
  method?: string;
  dirty?: boolean;
  hasReadme?: boolean;
}

interface EditorState {
  // Tab management
  tabs: TabData[];
  activeTabPath: string | null;

  // Layout
  sidebarWidth: number;
  responseHeight: number;
  splitDirection: SplitDirection;

  // Request editor state
  requestTab: string;
  responseTab: string;
  bodyViewMode: 'pretty' | 'raw' | 'table';

  // Response cache
  responseCache: Record<string, RunResult>;

  // Modals
  settingsOpen: boolean;
  envSettingsOpen: boolean;
  commandPaletteOpen: boolean;

  // Site config (published mode)
  siteConfig: SiteConfig | null;

  // Tab actions
  openTab: (tab: TabData) => void;
  closeTab: (path: string) => void;
  setActiveTab: (path: string) => void;
  markDirty: (path: string, dirty: boolean) => void;

  // Layout actions
  setSidebarWidth: (w: number) => void;
  setResponseHeight: (h: number) => void;
  setSplitDirection: (d: SplitDirection) => void;

  // Editor tab state
  setRequestTab: (tab: string) => void;
  setResponseTab: (tab: string) => void;
  setBodyViewMode: (mode: 'pretty' | 'raw' | 'table') => void;

  // Response
  cacheResponse: (path: string, result: RunResult) => void;
  getResponse: (path: string) => RunResult | undefined;

  // Modal actions
  setSettingsOpen: (open: boolean) => void;
  setEnvSettingsOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;

  // Published mode
  setSiteConfig: (config: SiteConfig | null) => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  tabs: [],
  activeTabPath: null,

  sidebarWidth: Number(localStorage.getItem('invoker:sidebar-width')) || 260,
  responseHeight: Number(localStorage.getItem('invoker:response-height')) || 300,
  splitDirection: (localStorage.getItem('invoker:split-direction') as SplitDirection) || 'horizontal',

  requestTab: 'Body',
  responseTab: 'Body',
  bodyViewMode: 'pretty',
  responseCache: {},

  settingsOpen: false,
  envSettingsOpen: false,
  commandPaletteOpen: false,
  siteConfig: null,

  openTab: (tab) =>
    set((state) => {
      const exists = state.tabs.find((t) => t.path === tab.path);
      if (exists) {
        return { activeTabPath: tab.path };
      }
      return {
        tabs: [...state.tabs, tab],
        activeTabPath: tab.path,
      };
    }),

  closeTab: (path) =>
    set((state) => {
      const idx = state.tabs.findIndex((t) => t.path === path);
      if (idx === -1) return state;
      const next = state.tabs.filter((t) => t.path !== path);
      let nextActive = state.activeTabPath;
      if (state.activeTabPath === path) {
        if (next.length === 0) {
          nextActive = null;
        } else if (idx >= next.length) {
          nextActive = next[next.length - 1].path;
        } else {
          nextActive = next[idx].path;
        }
      }
      return { tabs: next, activeTabPath: nextActive };
    }),

  setActiveTab: (path) => set({ activeTabPath: path }),

  markDirty: (path, dirty) =>
    set((state) => ({
      tabs: state.tabs.map((t) =>
        t.path === path ? { ...t, dirty } : t,
      ),
    })),

  setSidebarWidth: (w) => {
    set({ sidebarWidth: w });
    localStorage.setItem('invoker:sidebar-width', String(w));
  },

  setResponseHeight: (h) => {
    set({ responseHeight: h });
    localStorage.setItem('invoker:response-height', String(h));
  },

  setSplitDirection: (d) => {
    set({ splitDirection: d });
    localStorage.setItem('invoker:split-direction', d);
  },

  setRequestTab: (tab) => set({ requestTab: tab }),
  setResponseTab: (tab) => set({ responseTab: tab }),
  setBodyViewMode: (mode) => set({ bodyViewMode: mode }),

  cacheResponse: (path, result) =>
    set((state) => ({
      responseCache: { ...state.responseCache, [path]: result },
    })),

  getResponse: (path) => get().responseCache[path],

  setSettingsOpen: (open) => set({ settingsOpen: open }),
  setEnvSettingsOpen: (open) => set({ envSettingsOpen: open }),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

  setSiteConfig: (config) => set({ siteConfig: config }),
}));
