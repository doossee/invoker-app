import { isTauri } from './platform';
import { sampleCollection, type CollectionFile } from '@/data/sample-collection';
import { sampleDocs, type DocFile } from '@/data/sample-docs';
import type { SiteConfig } from '@/types/site-config';

export interface CollectionData {
  basePath: string;
  ivkFiles: CollectionFile[];
  mdFiles: DocFile[];
}

export async function openCollectionDialog(): Promise<string | null> {
  if (!isTauri()) return null;
  const { open } = await import('@tauri-apps/plugin-dialog');
  const selected = await open({ directory: true, multiple: false, title: 'Open Collection Folder' });
  return typeof selected === 'string' ? selected : null;
}

export async function loadCollection(folderPath: string | null): Promise<CollectionData> {
  if (!isTauri() || !folderPath) {
    return { basePath: '(sample)', ivkFiles: sampleCollection, mdFiles: sampleDocs };
  }

  const { readDir, readTextFile } = await import('@tauri-apps/plugin-fs');
  const ivkFiles: CollectionFile[] = [];
  const mdFiles: DocFile[] = [];

  async function scanDir(dirPath: string, relativePath: string): Promise<void> {
    let entries;
    try { entries = await readDir(dirPath); } catch { return; }
    for (const entry of entries) {
      if (!entry.name) continue;
      const fullPath = dirPath.endsWith('/') ? `${dirPath}${entry.name}` : `${dirPath}/${entry.name}`;
      const relPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
      if (entry.isDirectory) {
        if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist') continue;
        await scanDir(fullPath, relPath);
      } else if (entry.name.endsWith('.ivk')) {
        try {
          const content = await readTextFile(fullPath);
          ivkFiles.push({ path: relPath, name: entry.name.replace('.ivk', ''), content });
        } catch { /* skip */ }
      } else if (entry.name.endsWith('.md') && !entry.name.startsWith('_')) {
        try {
          const content = await readTextFile(fullPath);
          const title = entry.name.replace('.md', '').replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          mdFiles.push({ path: relPath, title, content });
        } catch { /* skip */ }
      }
    }
  }

  await scanDir(folderPath, '');
  ivkFiles.sort((a, b) => a.path.localeCompare(b.path));
  mdFiles.sort((a, b) => a.path.localeCompare(b.path));
  return { basePath: folderPath, ivkFiles, mdFiles };
}

export async function loadFromManifest(): Promise<CollectionData & { config?: SiteConfig }> {
  const { loadManifest } = await import('./manifest-loader');
  const manifest = await loadManifest();
  return {
    basePath: '(published)',
    ivkFiles: manifest.ivkFiles.map(f => ({ path: f.path, name: f.name, content: f.content })),
    mdFiles: manifest.mdFiles.map(f => ({ path: f.path, title: f.title, content: f.content })),
    config: manifest.config,
  };
}

export function watchCollection(folderPath: string, onChange: () => void): () => void {
  if (!isTauri() || !folderPath) return () => {};
  const intervalId = setInterval(onChange, 3000);
  return () => clearInterval(intervalId);
}

/* ------------------------------------------------------------------ */
/*  Browser fallback: File System Access API                            */
/*                                                                      */
/*  Lets non-Tauri browsers open a local folder and stream its .ivk/.md */
/*  files into the collection. Supported in Chrome/Edge/Opera — not in  */
/*  Safari/Firefox (as of 2026). When unsupported, hasBrowserFolderApi  */
/*  returns false and the UI falls back to "Try sample collection".     */
/* ------------------------------------------------------------------ */

export function hasBrowserFolderApi(): boolean {
  return typeof window !== 'undefined' && typeof (window as unknown as { showDirectoryPicker?: unknown }).showDirectoryPicker === 'function';
}

/* The File System Access API types aren't in the default TS lib yet — declare
 * the bits we use so we don't have to cast everywhere. */
type FsaDirHandle = {
  name: string;
  kind: 'directory';
  values?: () => AsyncIterable<FsaHandle>;
  entries?: () => AsyncIterable<[string, FsaHandle]>;
  [Symbol.asyncIterator]?: () => AsyncIterator<[string, FsaHandle]>;
};
type FsaFileHandle = { name: string; kind: 'file'; getFile: () => Promise<File> };
type FsaHandle = FsaDirHandle | FsaFileHandle;

export async function openCollectionFromBrowser(): Promise<CollectionData | null> {
  if (!hasBrowserFolderApi()) {
    console.warn('[invoker] showDirectoryPicker not available in this browser');
    return null;
  }
  const win = window as unknown as { showDirectoryPicker: (opts?: { mode?: 'read' | 'readwrite' }) => Promise<FsaDirHandle> };

  let dirHandle: FsaDirHandle;
  try {
    dirHandle = await win.showDirectoryPicker({ mode: 'read' });
  } catch (e) {
    // AbortError = user cancelled — silently return.
    if (e instanceof DOMException && e.name === 'AbortError') return null;
    // Anything else is a real failure — re-throw so the hook can show it.
    console.warn('[invoker] folder picker failed:', e);
    throw e;
  }

  const ivkFiles: CollectionFile[] = [];
  const mdFiles: DocFile[] = [];

  // Walks the picked directory recursively. Iterates via `values()` if
  // available; falls back to `entries()` (older spec); falls back again to
  // the async-iterable protocol on the handle itself.
  async function walk(handle: FsaDirHandle, rel: string): Promise<void> {
    let iter: AsyncIterable<FsaHandle> | undefined;
    if (typeof handle.values === 'function') {
      iter = handle.values();
    } else if (typeof handle.entries === 'function') {
      // entries() yields [name, handle] tuples — map to handles.
      const entriesIter = handle.entries();
      iter = (async function* () {
        for await (const [, h] of entriesIter) yield h;
      })();
    } else if (handle[Symbol.asyncIterator]) {
      const asyncIter = handle[Symbol.asyncIterator]!();
      iter = (async function* () {
        while (true) {
          const r = await asyncIter.next();
          if (r.done) break;
          yield r.value[1];
        }
      })();
    }
    if (!iter) {
      console.warn(`[invoker] no iteration interface on directory handle for ${rel || dirHandle.name}`);
      return;
    }

    try {
      for await (const entry of iter) {
        if (!entry || !entry.name) continue;
        // Skip dotfiles, node_modules, dist — typical noise folders.
        if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist') continue;
        const full = rel ? `${rel}/${entry.name}` : entry.name;
        if (entry.kind === 'directory') {
          await walk(entry, full);
        } else if (entry.name.endsWith('.ivk')) {
          try {
            const file = await (entry as FsaFileHandle).getFile();
            const content = await file.text();
            ivkFiles.push({ path: full, name: entry.name.replace('.ivk', ''), content });
          } catch (e) {
            console.warn(`[invoker] couldn't read ${full}:`, e);
          }
        } else if (entry.name.endsWith('.md') && !entry.name.startsWith('_')) {
          try {
            const file = await (entry as FsaFileHandle).getFile();
            const content = await file.text();
            const title = entry.name
              .replace('.md', '')
              .replace(/[-_]/g, ' ')
              .replace(/\b\w/g, (c) => c.toUpperCase());
            mdFiles.push({ path: full, title, content });
          } catch (e) {
            console.warn(`[invoker] couldn't read ${full}:`, e);
          }
        }
      }
    } catch (e) {
      console.warn(`[invoker] walk failed at ${rel || dirHandle.name}:`, e);
    }
  }

  await walk(dirHandle, '');
  ivkFiles.sort((a, b) => a.path.localeCompare(b.path));
  mdFiles.sort((a, b) => a.path.localeCompare(b.path));
  console.info(`[invoker] loaded ${ivkFiles.length} .ivk + ${mdFiles.length} .md from "${dirHandle.name}"`);
  return { basePath: dirHandle.name, ivkFiles, mdFiles };
}
