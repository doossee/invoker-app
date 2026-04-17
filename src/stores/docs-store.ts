import { create } from 'zustand';

interface DocsState {
  activeDocPath: string | null;
  expandedFolders: Set<string>;
  setActiveDoc: (path: string) => void;
  toggleFolder: (path: string) => void;
  clearActiveDoc: () => void;
}

export const useDocsStore = create<DocsState>((set) => ({
  activeDocPath: null,
  expandedFolders: new Set<string>(),

  setActiveDoc: (path) => set({ activeDocPath: path }),
  clearActiveDoc: () => set({ activeDocPath: null }),

  toggleFolder: (folder) =>
    set((state) => {
      const next = new Set(state.expandedFolders);
      if (next.has(folder)) next.delete(folder);
      else next.add(folder);
      return { expandedFolders: next };
    }),
}));
