import { create } from 'zustand';
import type { RunResult, HttpMethod } from 'ivkjs';
import type { SiteConfig } from '@/types/site-config';
import { useCollectionStore } from '@/stores/collection-store';

export type SplitDirection = 'horizontal' | 'vertical';

export interface TabData {
  kind: 'ivk' | 'folder' | 'doc';
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
  sidebarCollapsed: boolean;
  responseHeight: number;
  splitDirection: SplitDirection;

  // Editor preferences
  vimMode: boolean;
  /** Method picked when creating a new untitled request via ⌘N or +. */
  defaultRequestMethod: HttpMethod;
  /** Default request timeout (seconds). Used when no `@timeout` directive
      is set on the request. Per-request `@timeout` always wins. */
  defaultTimeoutSec: number;

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
  /** Patch fields on an existing tab (e.g. method changed in the editor). */
  updateTab: (path: string, patch: Partial<TabData>) => void;

  // Layout actions
  setSidebarWidth: (w: number) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  setResponseHeight: (h: number) => void;
  setSplitDirection: (d: SplitDirection) => void;

  // Editor preference actions
  setVimMode: (on: boolean) => void;
  setDefaultRequestMethod: (method: HttpMethod) => void;
  setDefaultTimeoutSec: (sec: number) => void;

  // Inline request creation
  createInlineTab: (opts?: { method?: HttpMethod; url?: string }) => string;

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
  sidebarCollapsed: localStorage.getItem('invoker:sidebar-collapsed') === '1',
  responseHeight: Number(localStorage.getItem('invoker:response-height')) || 300,
  splitDirection: (localStorage.getItem('invoker:split-direction') as SplitDirection) || 'horizontal',
  vimMode: localStorage.getItem('invoker:vim-mode') === '1',
  defaultRequestMethod: (localStorage.getItem('invoker:default-request-method') as HttpMethod) || 'GET',
  defaultTimeoutSec: Number(localStorage.getItem('invoker:default-timeout-sec')) || 30,

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

  updateTab: (path, patch) =>
    set((state) => ({
      tabs: state.tabs.map((t) => (t.path === path ? { ...t, ...patch } : t)),
    })),

  setSidebarWidth: (w) => {
    set({ sidebarWidth: w });
    localStorage.setItem('invoker:sidebar-width', String(w));
  },

  setSidebarCollapsed: (collapsed) => {
    set({ sidebarCollapsed: collapsed });
    localStorage.setItem('invoker:sidebar-collapsed', collapsed ? '1' : '0');
  },

  toggleSidebar: () => {
    const next = !get().sidebarCollapsed;
    set({ sidebarCollapsed: next });
    localStorage.setItem('invoker:sidebar-collapsed', next ? '1' : '0');
  },

  setVimMode: (on) => {
    set({ vimMode: on });
    localStorage.setItem('invoker:vim-mode', on ? '1' : '0');
  },

  setDefaultRequestMethod: (method) => {
    set({ defaultRequestMethod: method });
    localStorage.setItem('invoker:default-request-method', method);
  },

  setDefaultTimeoutSec: (sec) => {
    // Clamp to a sane range so a typo or stale setting doesn't hang
    // requests forever or fail them instantly.
    const clamped = Math.max(1, Math.min(600, Math.floor(sec)));
    set({ defaultTimeoutSec: clamped });
    localStorage.setItem('invoker:default-timeout-sec', String(clamped));
  },

  createInlineTab: (opts) => {
    const ts = Date.now().toString(36);
    const path = `inline/Untitled-${ts}.ivk`;
    const method = opts?.method ?? get().defaultRequestMethod;
    // parseIvk needs both a method AND a URL on the request line — a
    // bare "${method} \n" round-trips as GET (no URL → fallback). Seed
    // a `https://` prefix so the chosen method survives the parse and
    // the user has a useful starting point to extend.
    const url = opts?.url ?? 'https://';
    const content = `${method} ${url}\n`;
    // Register inline file content BEFORE opening the tab so RequestEditor's
    // first render finds it via getFileByPath.
    useCollectionStore.getState().addInlineFile(path, content);
    get().openTab({ kind: 'ivk', path, name: 'Untitled', method });
    return path;
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
