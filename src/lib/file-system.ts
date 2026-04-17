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
