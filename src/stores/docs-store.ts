import { create } from 'zustand';
import { sampleDocs, type DocFile } from '@/data/sample-docs';

interface DocsState {
  activeDocPath: string | null;
  expandedFolders: Set<string>;
  docs: DocFile[];
  setActiveDoc: (path: string) => void;
  toggleFolder: (path: string) => void;
  clearActiveDoc: () => void;
  loadDocs: (docs: DocFile[]) => void;
}

export const useDocsStore = create<DocsState>((set) => ({
  activeDocPath: null,
  expandedFolders: new Set<string>(),
  docs: sampleDocs,

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
}));
