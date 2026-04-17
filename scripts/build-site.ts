#!/usr/bin/env tsx
import { Command } from 'commander';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { generateManifest } from './generate-manifest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const program = new Command();

program
  .name('invoker')
  .description('Build a static documentation site from an Invoker collection')
  .argument('<collection-path>', 'Path to the collection folder')
  .option('--out <dir>', 'Output directory', './dist-site')
  .option('--base <url>', 'Override baseUrl from config')
  .option('--title <text>', 'Override title from config')
  .action((collectionPath: string, opts: { out: string; base?: string; title?: string }) => {
    const absCollection = path.resolve(collectionPath);
    const absOut = path.resolve(opts.out);
    const projectRoot = path.resolve(__dirname, '..');

    console.log('⚡ Invoker — Building static site\n');
    console.log(`  Collection: ${absCollection}`);
    console.log(`  Output:     ${absOut}\n`);

    // Step 1: Generate manifest
    console.log('📦 Scanning collection...');
    const manifest = generateManifest(absCollection);
    if (opts.title) manifest.config.title = opts.title;
    if (opts.base) manifest.config.baseUrl = opts.base;

    // Step 2: Write manifest to public/
    const publicDir = path.join(projectRoot, 'public');
    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
    fs.writeFileSync(path.join(publicDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
    console.log('  ✅ manifest.json written\n');

    // Step 3: Copy favicon
    if (manifest.config.favicon) {
      const faviconSrc = path.join(absCollection, manifest.config.favicon);
      if (fs.existsSync(faviconSrc)) {
        fs.copyFileSync(faviconSrc, path.join(publicDir, 'favicon.svg'));
        console.log('  ✅ favicon copied\n');
      }
    }

    // Step 4: Generate index.html
    const templatePath = path.join(__dirname, 'site-template.html');
    const template = fs.readFileSync(templatePath, 'utf-8');
    const originalIndex = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf-8');
    const indexHtml = template
      .replace('{{TITLE}}', manifest.config.title || 'Invoker Docs')
      .replace('{{DESCRIPTION}}', manifest.config.description || '')
      .replace('{{FAVICON}}', '/favicon.svg');
    fs.writeFileSync(path.join(projectRoot, 'index.html'), indexHtml);

    console.log('🔨 Building with Vite...\n');

    // Step 5: Vite build
    const baseUrl = manifest.config.baseUrl || '/';
    try {
      execSync(`npx vite build --base ${baseUrl} --outDir "${absOut}"`, {
        cwd: projectRoot,
        stdio: 'inherit',
      });
    } finally {
      // Restore original index.html
      fs.writeFileSync(path.join(projectRoot, 'index.html'), originalIndex);
      // Clean up manifest from public/
      const manifestInPublic = path.join(publicDir, 'manifest.json');
      if (fs.existsSync(manifestInPublic)) fs.unlinkSync(manifestInPublic);
    }

    // Step 6: Copy manifest to output
    fs.writeFileSync(path.join(absOut, 'manifest.json'), JSON.stringify(manifest));

    // Step 7: 404.html SPA fallback
    const builtIndex = path.join(absOut, 'index.html');
    if (fs.existsSync(builtIndex)) {
      fs.copyFileSync(builtIndex, path.join(absOut, '404.html'));
    }

    // Summary
    const totalSize = getTotalSize(absOut);
    console.log(`\n✅ Built ${manifest.mdFiles.length} docs + ${manifest.ivkFiles.length} requests → ${opts.out} (${formatSize(totalSize)})`);
  });

function getTotalSize(dir: string): number {
  let size = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) size += getTotalSize(p);
    else size += fs.statSync(p).size;
  }
  return size;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

program.parse();
