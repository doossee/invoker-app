import { create } from 'zustand';
import { sampleCollection, type CollectionFile } from '@/data/sample-collection';

interface CollectionState {
  files: CollectionFile[];
  expandedFolders: Set<string>;
  activeFilePath: string | null;
  setActiveFile: (path: string) => void;
  toggleFolder: (path: string) => void;
  getFileByPath: (path: string) => CollectionFile | undefined;
  getFolders: () => string[];
}

export const useCollectionStore = create<CollectionState>((set, get) => ({
  files: sampleCollection,
  expandedFolders: new Set<string>(),
  activeFilePath: null,

  setActiveFile: (path) => set({ activeFilePath: path }),

  toggleFolder: (folder) =>
    set((state) => {
      const next = new Set(state.expandedFolders);
      if (next.has(folder)) next.delete(folder);
      else next.add(folder);
      return { expandedFolders: next };
    }),

  getFileByPath: (path) => get().files.find((f) => f.path === path),

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
}));
