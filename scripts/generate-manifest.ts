import * as fs from 'node:fs';
import * as path from 'node:path';
import type { SiteManifest, SiteConfig } from '../src/types/site-config';

interface CollectionFile {
  path: string;
  name: string;
  content: string;
}

interface DocFile {
  path: string;
  title: string;
  content: string;
}

function readConfig(collectionPath: string): SiteConfig {
  const configPath = path.join(collectionPath, 'invoker.config.json');
  if (fs.existsSync(configPath)) {
    return JSON.parse(fs.readFileSync(configPath, 'utf-8')) as SiteConfig;
  }
  return { title: 'Invoker Docs' };
}

function scanDir(
  dirPath: string,
  relativePath: string,
  ivkFiles: CollectionFile[],
  mdFiles: DocFile[],
): void {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const relPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'dist-site') continue;
      scanDir(fullPath, relPath, ivkFiles, mdFiles);
    } else if (entry.name.endsWith('.ivk')) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      ivkFiles.push({ path: relPath, name: entry.name.replace('.ivk', ''), content });
    } else if (entry.name.endsWith('.md') && !entry.name.startsWith('_')) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const title = entry.name.replace('.md', '').replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      mdFiles.push({ path: relPath, title, content });
    }
  }
}

export function generateManifest(collectionPath: string): SiteManifest {
  const absPath = path.resolve(collectionPath);
  if (!fs.existsSync(absPath)) throw new Error(`Collection path not found: ${absPath}`);
  const config = readConfig(absPath);
  const ivkFiles: CollectionFile[] = [];
  const mdFiles: DocFile[] = [];
  scanDir(absPath, '', ivkFiles, mdFiles);
  ivkFiles.sort((a, b) => a.path.localeCompare(b.path));
  mdFiles.sort((a, b) => a.path.localeCompare(b.path));
  console.log(`  📄 Found ${ivkFiles.length} .ivk files`);
  console.log(`  📝 Found ${mdFiles.length} .md files`);
  return { config, ivkFiles, mdFiles };
}
