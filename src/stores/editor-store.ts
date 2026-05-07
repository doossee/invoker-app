import { create } from 'zustand';
import type { RunResult, HttpMethod } from 'ivkjs';
import type { SiteConfig } from '@/types/site-config';
import { useCollectionStore } from '@/stores/collection-store';

export type SplitDirection = 'horizontal' | 'vertical';

/* ------------------------------------------------------------------ */
/*  localStorage load helpers                                          */
/*                                                                      */
/*  The previous load path did `Number(localStorage.getItem(k)) || N`  */
/*  and `localStorage.getItem(k) as Foo`, both of which trust whatever */
/*  is stored. A user (or a buggy past version) writing -99 / 99999    */
/*  / "garbage" propagated unchecked into every consumer that read     */
/*  the value. The helpers below clamp + validate at load time so      */
/*  corrupted state can't soft-brick the app on cold start.            */
/* ------------------------------------------------------------------ */

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;
const SPLIT_DIRECTIONS = ['horizontal', 'vertical'] as const;

function loadInt(key: string, def: number, min: number, max: number): number {
  const raw = localStorage.getItem(key);
  if (raw === null) return def;
  const n = Number(raw);
  if (!Number.isFinite(n)) return def;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

function loadEnum<T extends readonly string[]>(
  key: string,
  allowed: T,
  def: T[number],
): T[number] {
  const raw = localStorage.getItem(key);
  if (raw === null) return def;
  return (allowed as readonly string[]).includes(raw) ? (raw as T[number]) : def;
}

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
  /** Auto-open the previously-loaded collection on next launch. Stores
      both the boolean (this preference) AND the most-recent path
      (`invoker:last-collection-path` in localStorage, set by
      useOpenCollection). */
  openLastOnLaunch: boolean;

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
  /**
   * Drop tabs whose path no longer exists in the loaded collection.
   * Called from `App.tsx` when the active collection changes (user
   * switched folders, sample → real, etc.). Inline tabs (path starts
   * with `inline/`) are always preserved — they live in memory only.
   *
   * @param valid `Set` of paths that ARE present in the new collection
   *   (both `.ivk` and `.md` paths, plus folder paths for folder tabs).
   */
  purgeStaleTabs: (valid: ReadonlySet<string>) => void;

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
  setOpenLastOnLaunch: (on: boolean) => void;

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

  // Sidebar width clamped 180–600px so a corrupted stored value can't
  // hide the editor entirely or render the sidebar at -50px width.
  sidebarWidth: loadInt('invoker:sidebar-width', 260, 180, 600),
  sidebarCollapsed: localStorage.getItem('invoker:sidebar-collapsed') === '1',
  // Response panel height clamped 120–800px for the same reason.
  responseHeight: loadInt('invoker:response-height', 300, 120, 800),
  splitDirection: loadEnum('invoker:split-direction', SPLIT_DIRECTIONS, 'horizontal'),
  vimMode: localStorage.getItem('invoker:vim-mode') === '1',
  defaultRequestMethod: loadEnum('invoker:default-request-method', HTTP_METHODS, 'GET'),
  // Timeout clamped 1–600s — matches the setter's clamp range so the
  // load and write paths agree.
  defaultTimeoutSec: loadInt('invoker:default-timeout-sec', 30, 1, 600),
  // Default ON — most users want their workspace back on next launch.
  // localStorage stores '0' to opt out so the default flips to ON without
  // needing an explicit '1' write on first launch.
  openLastOnLaunch: localStorage.getItem('invoker:open-last-on-launch') !== '0',

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
      // Track the open in recent-store (skip ephemeral inline paths so
      // every "+ New request" doesn't pollute the dashboard).
      if (!tab.path.startsWith('inline/')) {
        // Lazy-import to avoid a static circular import (recent-store
        // doesn't know about editor-store; editor-store doesn't need
        // recent-store at module-load time).
        void import('./recent-store').then(({ useRecentStore }) => {
          useRecentStore.getState().markOpened(tab.path);
        });
      }
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
      // Evict the cached response too. Previously the cache entry
      // outlived the tab — reopening showed a stale body, and many
      // open/close cycles leaked memory unboundedly (one entry per
      // path × every Send).
      const { [path]: _evicted, ...rest } = state.responseCache;
      return { tabs: next, activeTabPath: nextActive, responseCache: rest };
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

  purgeStaleTabs: (valid) =>
    set((state) => {
      const keep = state.tabs.filter(
        (t) => valid.has(t.path) || t.path.startsWith('inline/'),
      );
      if (keep.length === state.tabs.length) return state; // no-op fast path
      const droppedPaths = new Set(
        state.tabs.filter((t) => !keep.includes(t)).map((t) => t.path),
      );
      // Evict cached responses for the dropped tabs (mirrors the
      // single-tab eviction in closeTab from PR #80).
      const responseCache: typeof state.responseCache = {};
      for (const [path, result] of Object.entries(state.responseCache)) {
        if (!droppedPaths.has(path)) responseCache[path] = result;
      }
      // If the active tab got dropped, fall back to the first kept tab
      // (or null if everything's gone).
      const nextActive =
        state.activeTabPath && droppedPaths.has(state.activeTabPath)
          ? (keep[0]?.path ?? null)
          : state.activeTabPath;
      return { tabs: keep, activeTabPath: nextActive, responseCache };
    }),

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

  setOpenLastOnLaunch: (on) => {
    set({ openLastOnLaunch: on });
    localStorage.setItem('invoker:open-last-on-launch', on ? '1' : '0');
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
