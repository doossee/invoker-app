import { create } from 'zustand';
import type { DocFile } from '@/data/sample-docs';
import { isTauri } from '@/lib/platform';

/**
 * `activeDocPath`, `setActiveDoc`, `clearActiveDoc`, `expandedFolders`,
 * and `toggleFolder` were dropped along with the standalone DocsTree
 * surface — UnifiedTree (collection-store) handles tree expansion now.
 * The fields had no callers after DocsTree was removed.
 */
interface DocsState {
  docs: DocFile[];
  loadDocs: (docs: DocFile[]) => void;
  /**
   * Persist a doc's edited content. Updates in-memory state for every mode,
   * and in Tauri also writes back to the source `.md` file on disk so edits
   * survive a reload. Returns true if the disk write happened.
   */
  saveDoc: (path: string, content: string, collectionPath: string | null) => Promise<boolean>;
}

export const useDocsStore = create<DocsState>((set) => ({
  docs: [],

  loadDocs: (docs) => set({ docs }),

  saveDoc: async (path, content, collectionPath) => {
    set((state) => ({
      docs: state.docs.map((d) => (d.path === path ? { ...d, content } : d)),
    }));
    const virtual = !collectionPath || collectionPath === '(sample)' || collectionPath === '(published)';
    // Same Tauri 1-vs-2 detection bug as collection-store.saveRequest —
    // see that comment for the full story. Use the shared isTauri()
    // helper which checks all three signals.
    if (isTauri() && !virtual) {
      const { writeTextFile } = await import('@tauri-apps/plugin-fs');
      const sep = collectionPath!.endsWith('/') ? '' : '/';
      await writeTextFile(`${collectionPath}${sep}${path}`, content);
      return true;
    }
    return false;
  },
}));
