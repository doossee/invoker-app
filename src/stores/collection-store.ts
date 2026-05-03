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
  /**
   * Rename a file in the collection. Updates the in-memory map, and in
   * Tauri with a real folder also calls `@tauri-apps/plugin-fs.rename`
   * to move the file on disk. Returns the new path on success, null on
   * conflict (target already exists).
   */
  renameFile: (oldPath: string, newName: string) => Promise<string | null>;
  /**
   * Remove a file from the collection. Updates the in-memory map, and
   * in Tauri with a real folder also calls
   * `@tauri-apps/plugin-fs.remove` to delete the file on disk. Returns
   * true if a file was actually removed (regardless of mode).
   */
  deleteFile: (path: string) => Promise<boolean>;
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

  renameFile: async (oldPath, newName) => {
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
    const isInline = !!state.inlineFiles[oldPath];

    // For real files in a real Tauri folder, do the disk rename FIRST
    // so a fs error aborts before the in-memory state diverges. Inline
    // files never touch disk.
    if (!isInline) {
      const collectionPath = get().collectionPath;
      const virtual = !collectionPath || collectionPath === '(sample)' || collectionPath === '(published)';
      if (isTauri() && !virtual) {
        const { rename } = await import('@tauri-apps/plugin-fs');
        const sep = collectionPath!.endsWith('/') ? '' : '/';
        await rename(`${collectionPath}${sep}${oldPath}`, `${collectionPath}${sep}${newPath}`);
      }
    }

    if (isInline) {
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

  deleteFile: async (path) => {
    const state = get();
    if (state.inlineFiles[path]) {
      const { [path]: _drop, ...rest } = state.inlineFiles;
      set({ inlineFiles: rest });
      if (state.activeFilePath === path) set({ activeFilePath: null });
      return true;
    }
    if (!state.files.some((f) => f.path === path)) return false;

    // Disk delete first — fail fast before in-memory diverges.
    const collectionPath = get().collectionPath;
    const virtual = !collectionPath || collectionPath === '(sample)' || collectionPath === '(published)';
    if (isTauri() && !virtual) {
      const { remove } = await import('@tauri-apps/plugin-fs');
      const sep = collectionPath!.endsWith('/') ? '' : '/';
      await remove(`${collectionPath}${sep}${path}`);
    }

    set({ files: state.files.filter((f) => f.path !== path) });
    if (state.activeFilePath === path) set({ activeFilePath: null });
    return true;
  },
}));
