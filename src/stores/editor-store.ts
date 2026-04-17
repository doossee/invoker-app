import { create } from 'zustand';
import type { RunResult } from 'ivkjs';

interface EditorState {
  sidebarWidth: number;
  responseHeight: number;
  activeTab: string;
  sidebarView: 'collection' | 'docs';
  responseCache: Record<string, RunResult>;
  setSidebarWidth: (w: number) => void;
  setResponseHeight: (h: number) => void;
  setActiveTab: (tab: string) => void;
  setSidebarView: (view: 'collection' | 'docs') => void;
  cacheResponse: (path: string, result: RunResult) => void;
  getResponse: (path: string) => RunResult | undefined;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  sidebarWidth: Number(localStorage.getItem('invoker:sidebar-width')) || 260,
  responseHeight: Number(localStorage.getItem('invoker:response-height')) || 300,
  activeTab: 'body',
  sidebarView: 'collection',
  responseCache: {},

  setSidebarWidth: (w) => {
    set({ sidebarWidth: w });
    localStorage.setItem('invoker:sidebar-width', String(w));
  },

  setResponseHeight: (h) => {
    set({ responseHeight: h });
    localStorage.setItem('invoker:response-height', String(h));
  },

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSidebarView: (view) => set({ sidebarView: view }),

  cacheResponse: (path, result) =>
    set((state) => ({
      responseCache: { ...state.responseCache, [path]: result },
    })),

  getResponse: (path) => get().responseCache[path],
}));
