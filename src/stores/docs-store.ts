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
  /**
   * Create a new `.md` doc inside `parentFolder` (empty string =
   * collection root). Returns the new path on success, null on
   * conflict. In Tauri with a real folder, also writes the file to
   * disk via `@tauri-apps/plugin-fs.writeTextFile`.
   *
   * @param initialContent  optional seed content. Defaults to empty
   *   string; the "New folder" creation flow passes a placeholder
   *   header so the doc isn't completely blank.
   */
  createDoc: (
    parentFolder: string,
    name: string,
    collectionPath: string | null,
    initialContent?: string,
  ) => Promise<string | null>;
}

export const useDocsStore = create<DocsState>((set, get) => ({
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

  createDoc: async (parentFolder, name, collectionPath, initialContent = '') => {
    const cleanedName = name.endsWith('.md') ? name : `${name}.md`;
    const folder = parentFolder ? parentFolder.replace(/\/$/, '') + '/' : '';
    const newPath = `${folder}${cleanedName}`;
    const state = get();
    if (state.docs.some((d) => d.path === newPath)) return null;
    // Tauri disk write FIRST so a fs error aborts before the in-
    // memory state diverges (matches saveDoc / collection-store
    // patterns).
    const virtual =
      !collectionPath ||
      collectionPath === '(sample)' ||
      collectionPath === '(published)';
    if (isTauri() && !virtual) {
      const { writeTextFile } = await import('@tauri-apps/plugin-fs');
      const sep = collectionPath!.endsWith('/') ? '' : '/';
      await writeTextFile(`${collectionPath}${sep}${newPath}`, initialContent);
    }
    set({
      docs: [
        ...state.docs,
        {
          path: newPath,
          title: cleanedName.replace(/\.md$/, ''),
          content: initialContent,
        },
      ],
    });
    return newPath;
  },
}));
