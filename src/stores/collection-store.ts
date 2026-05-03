import { create } from 'zustand';
import type { CollectionFile } from '@/data/sample-collection';

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
  /**
   * Rename a file in the in-memory collection. Returns the new path on
   * success, null on conflict (target already exists). Tauri disk
   * rename is a follow-up — for now this is browser-mode only.
   */
  renameFile: (oldPath: string, newName: string) => string | null;
  /** Remove a file from the in-memory collection. Returns true if a file
      was actually removed. Tauri disk delete is a follow-up. */
  deleteFile: (path: string) => boolean;
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
    const collectionPath = get().collectionPath;
    const virtual = !collectionPath || collectionPath === '(sample)' || collectionPath === '(published)';
    const tauri = typeof window !== 'undefined' && '__TAURI__' in window;
    if (tauri && !virtual) {
      const { writeTextFile } = await import('@tauri-apps/plugin-fs');
      const sep = collectionPath!.endsWith('/') ? '' : '/';
      await writeTextFile(`${collectionPath}${sep}${path}`, content);
      return true;
    }
    return false;
  },

  renameFile: (oldPath, newName) => {
    // newName is just the file name (without folder); preserve the folder
    // and append `.ivk` if the user didn't.
    const parts = oldPath.split('/');
    const folder = parts.length > 1 ? parts.slice(0, -1).join('/') + '/' : '';
    const cleaned = newName.endsWith('.ivk') ? newName : `${newName}.ivk`;
    const newPath = `${folder}${cleaned}`;
    if (newPath === oldPath) return oldPath;
    // Conflict check across both real and inline files.
    const state = get();
    if (state.files.some((f) => f.path === newPath) || state.inlineFiles[newPath]) {
      return null;
    }
    if (state.inlineFiles[oldPath]) {
      const existing = state.inlineFiles[oldPath]!;
      const { [oldPath]: _drop, ...rest } = state.inlineFiles;
      const renamedName = cleaned.replace('.ivk', '');
      set({
        inlineFiles: {
          ...rest,
          [newPath]: { ...existing, path: newPath, name: renamedName },
        },
      });
    } else {
      set({
        files: state.files.map((f) =>
          f.path === oldPath
            ? { ...f, path: newPath, name: cleaned.replace('.ivk', '') }
            : f,
        ),
      });
    }
    if (state.activeFilePath === oldPath) set({ activeFilePath: newPath });
    return newPath;
  },

  deleteFile: (path) => {
    const state = get();
    if (state.inlineFiles[path]) {
      const { [path]: _drop, ...rest } = state.inlineFiles;
      set({ inlineFiles: rest });
      if (state.activeFilePath === path) set({ activeFilePath: null });
      return true;
    }
    const next = state.files.filter((f) => f.path !== path);
    if (next.length === state.files.length) return false;
    set({ files: next });
    if (state.activeFilePath === path) set({ activeFilePath: null });
    return true;
  },
}));
