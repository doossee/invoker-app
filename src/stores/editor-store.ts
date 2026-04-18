import { create } from 'zustand';
import type { RunResult } from 'ivkjs';
import type { SiteConfig } from '@/types/site-config';

type SplitDirection = 'horizontal' | 'vertical';

interface EditorState {
  sidebarWidth: number;
  responseHeight: number;
  splitDirection: SplitDirection;
  activeTab: string;
  responseTab: string;
  responseCache: Record<string, RunResult>;
  siteConfig: SiteConfig | null;
  setSidebarWidth: (w: number) => void;
  setResponseHeight: (h: number) => void;
  setSplitDirection: (d: SplitDirection) => void;
  setActiveTab: (tab: string) => void;
  setResponseTab: (tab: string) => void;
  cacheResponse: (path: string, result: RunResult) => void;
  getResponse: (path: string) => RunResult | undefined;
  setSiteConfig: (config: SiteConfig | null) => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  sidebarWidth: Number(localStorage.getItem('invoker:sidebar-width')) || 260,
  responseHeight: Number(localStorage.getItem('invoker:response-height')) || 300,
  splitDirection: (localStorage.getItem('invoker:split-direction') as SplitDirection) || 'horizontal',
  activeTab: 'Body',
  responseTab: 'Body',
  responseCache: {},
  siteConfig: null,

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

  setActiveTab: (tab) => set({ activeTab: tab }),

  setResponseTab: (tab) => set({ responseTab: tab }),

  cacheResponse: (path, result) =>
    set((state) => ({
      responseCache: { ...state.responseCache, [path]: result },
    })),

  getResponse: (path) => get().responseCache[path],

  setSiteConfig: (config) => set({ siteConfig: config }),
}));
