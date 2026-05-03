import { create } from 'zustand';
import type { DocFile } from '@/data/sample-docs';

interface DocsState {
  activeDocPath: string | null;
  expandedFolders: Set<string>;
  docs: DocFile[];
  setActiveDoc: (path: string) => void;
  toggleFolder: (path: string) => void;
  clearActiveDoc: () => void;
  loadDocs: (docs: DocFile[]) => void;
  /**
   * Persist a doc's edited content. Updates in-memory state for every mode,
   * and in Tauri also writes back to the source `.md` file on disk so edits
   * survive a reload. Returns true if the disk write happened.
   */
  saveDoc: (path: string, content: string, collectionPath: string | null) => Promise<boolean>;
}

export const useDocsStore = create<DocsState>((set) => ({
  activeDocPath: null,
  expandedFolders: new Set<string>(),
  docs: [],

  setActiveDoc: (path) => set({ activeDocPath: path }),
  clearActiveDoc: () => set({ activeDocPath: null }),

  toggleFolder: (folder) =>
    set((state) => {
      const next = new Set(state.expandedFolders);
      if (next.has(folder)) next.delete(folder);
      else next.add(folder);
      return { expandedFolders: next };
    }),

  loadDocs: (docs) => set({ docs }),

  saveDoc: async (path, content, collectionPath) => {
    set((state) => ({
      docs: state.docs.map((d) => (d.path === path ? { ...d, content } : d)),
    }));
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
}));
