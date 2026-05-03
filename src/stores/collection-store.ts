import { create } from 'zustand';
import type { CollectionFile } from '@/data/sample-collection';
import { isTauri } from '@/lib/platform';

interface CollectionState {
  files: CollectionFile[];
  /** Ephemeral requests created via "New Request" — not persisted to disk. */
  inlineFiles: Record<string, CollectionFile>;
  expandedFolders: Set<string>;
  activeFilePath: string | null;
  collectionPath: string | null;
  isLoading: boolean;
  setActiveFile: (path: string) => void;
  toggleFolder: (path: string) => void;
  getFileByPath: (path: string) => CollectionFile | undefined;
  getFolders: () => string[];
  loadCollection: (data: { ivkFiles: CollectionFile[]; basePath: string }) => void;
  setCollectionPath: (path: string | null) => void;
  addInlineFile: (path: string, content: string) => void;
  updateInlineFile: (path: string, content: string) => void;
  /**
   * Persist a file's serialized content. Updates in-memory state for every
   * mode, and also writes to disk when running in Tauri with a real
   * collection folder. Returns true if the write reached disk.
   */
  saveRequest: (path: string, content: string) => Promise<boolean>;
}

export const useCollectionStore = create<CollectionState>((set, get) => ({
  files: [],
  inlineFiles: {},
  expandedFolders: new Set<string>(),
  activeFilePath: null,
  collectionPath: null,
  isLoading: false,

  setActiveFile: (path) => set({ activeFilePath: path }),

  toggleFolder: (folder) =>
    set((state) => {
      const next = new Set(state.expandedFolders);
      if (next.has(folder)) next.delete(folder);
      else next.add(folder);
      return { expandedFolders: next };
    }),

  getFileByPath: (path) => {
    const inline = get().inlineFiles[path];
    if (inline) return inline;
    return get().files.find((f) => f.path === path);
  },

  getFolders: () => {
    const folders = new Set<string>();
    for (const file of get().files) {
      const parts = file.path.split('/');
      if (parts.length > 1) {
        folders.add(parts.slice(0, -1).join('/'));
      }
    }
    return Array.from(folders).sort();
  },

  loadCollection: ({ ivkFiles, basePath }) =>
    set({ files: ivkFiles, collectionPath: basePath, isLoading: false }),

  setCollectionPath: (path) => set({ collectionPath: path }),

  addInlineFile: (path, content) => {
    const name = path.split('/').pop()?.replace('.ivk', '') ?? path;
    set((state) => ({
      inlineFiles: { ...state.inlineFiles, [path]: { path, name, content } },
    }));
  },

  updateInlineFile: (path, content) => {
    set((state) => {
      const existing = state.inlineFiles[path];
      if (!existing) return state;
      return {
        inlineFiles: { ...state.inlineFiles, [path]: { ...existing, content } },
      };
    });
  },

  saveRequest: async (path, content) => {
    // Inline files never touch disk — update the in-memory map and return.
    if (get().inlineFiles[path]) {
      set((state) => ({
        inlineFiles: {
          ...state.inlineFiles,
          [path]: { ...state.inlineFiles[path], content },
        },
      }));
      return false;
    }
    // Regular file: always update the in-memory collection so the UI
    // reflects the save immediately regardless of which mode we're in.
    set((state) => ({
      files: state.files.map((f) => (f.path === path ? { ...f, content } : f)),
    }));
    // Tauri desktop mode with a real folder → write through to disk.
    // Use the shared `isTauri()` detector — the inline `'__TAURI__' in
    // window` check that used to live here only matched Tauri 1; Tauri 2
    // sets `window.isTauri` and `window.__TAURI_INTERNALS__` instead, so
    // the desktop build silently fell through to the no-write branch and
    // ⌘S did nothing on disk. (Same root cause as the "Open folder"
    // bug fixed in PR #4 — the platform-flags drift hits every spot
    // that hand-rolls Tauri detection.)
    const collectionPath = get().collectionPath;
    const virtual = !collectionPath || collectionPath === '(sample)' || collectionPath === '(published)';
    if (isTauri() && !virtual) {
      const { writeTextFile } = await import('@tauri-apps/plugin-fs');
      const sep = collectionPath!.endsWith('/') ? '' : '/';
      await writeTextFile(`${collectionPath}${sep}${path}`, content);
      return true;
    }
    return false;
  },
}));
