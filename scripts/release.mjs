#!/usr/bin/env node
// release.mjs — sync version across package.json / tauri.conf.json / Cargo.toml
// and create a release commit + tag. Does NOT push — prints the push command.
//
// Usage: node scripts/release.mjs <version>
//   --force         skip dirty-tree refusal
//   --dry-run       print intended actions without touching anything
// Env:
//   RELEASE_BRANCH  override required branch name (default: main)

import { spawn } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SEMVER_RE = /^v?(\d+\.\d+\.\d+(?:-[\w.]+)?)$/;

/**
 * Validate a user-supplied version string. Strips a leading 'v' if present.
 */
export function validateVersion(input) {
  if (typeof input !== 'string' || input.length === 0) {
    return { ok: false, error: 'version is required (semver, e.g. 0.2.0)' };
  }
  const m = input.match(SEMVER_RE);
  if (!m) {
    return { ok: false, error: `not a valid semver: ${JSON.stringify(input)}` };
  }
  return { ok: true, version: m[1] };
}

/** Rewrite package.json, preserving 2-space indent and trailing newline. */
export function rewritePackageJson(before, version) {
  const obj = JSON.parse(before);
  obj.version = version;
  const trailing = before.endsWith('\n') ? '\n' : '';
  return JSON.stringify(obj, null, 2) + trailing;
}

/** Rewrite Tauri's config JSON. Same shape as package.json — top-level "version". */
export function rewriteTauriConfJson(before, version) {
  const obj = JSON.parse(before);
  obj.version = version;
  const trailing = before.endsWith('\n') ? '\n' : '';
  return JSON.stringify(obj, null, 2) + trailing;
}

/**
 * Rewrite Cargo.toml's [package] version, leaving [dependencies] untouched.
 * Line-based — no TOML parser needed for a single substitution.
 */
export function rewriteCargoToml(before, version) {
  const lines = before.split('\n');
  let inPackage = false;
  let updated = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*\[package\]\s*$/.test(line)) { inPackage = true; continue; }
    if (inPackage && /^\s*\[(?!package[.\]])[^\]]+\]\s*$/.test(line)) { inPackage = false; continue; }
    if (inPackage && /^\s*version\s*=\s*"/.test(line)) {
      lines[i] = line.replace(/version\s*=\s*"[^"]*"/, `version = "${version}"`);
      updated = true;
      break;
    }
  }
  if (!updated) {
    throw new Error('Cargo.toml has no [package] version line — refusing to write a malformed manifest');
  }
  return lines.join('\n');
}

/**
 * Cross-platform check for "this file invoked as the main script".
 * (`import.meta.url` is a file:// URL; process.argv[1] is a path —
 * they need normalization to compare on Windows.)
 */
function isMainModule() {
  try {
    return fileURLToPath(import.meta.url) === process.argv[1];
  } catch {
    return false;
  }
}

/**
 * Run a subprocess and capture stdio. Returns { code, stdout, stderr }.
 * Used as the default runner; tests inject a fake.
 */
async function defaultRunner(cmd, args, opts = {}) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { cwd: opts.cwd, env: process.env });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => { stdout += d.toString(); });
    child.stderr.on('data', (d) => { stderr += d.toString(); });
    child.on('close', (code) => resolve({ code, stdout, stderr }));
    child.on('error', (err) => resolve({ code: 127, stdout: '', stderr: err.message }));
  });
}

/**
 * Drive a release end-to-end: rewrite the three manifests, refresh
 * Cargo.lock, commit, tag. Does NOT push — caller does that manually.
 *
 * Args:
 *   version    semver string (validated by validateVersion before calling)
 *   cwd        working directory (defaults to repo root)
 *   runner     subprocess runner (defaults to spawn-based default)
 *   paths      override file paths (test fixtures use this)
 *   force      skip dirty-tree check
 *   branch     required git branch (default 'main', or RELEASE_BRANCH env)
 *   dryRun     log without writing/committing
 */
export async function runRelease({
  version,
  cwd = process.cwd(),
  runner = defaultRunner,
  paths = {
    packageJson: join(cwd, 'package.json'),
    tauriConf: join(cwd, 'src-tauri/tauri.conf.json'),
    cargoToml: join(cwd, 'src-tauri/Cargo.toml'),
  },
  force = false,
  branch = process.env.RELEASE_BRANCH || 'main',
  dryRun = false,
} = {}) {
  // 1. Working-tree clean?
  if (!force) {
    const status = await runner('git', ['status', '--porcelain'], { cwd });
    if (status.code !== 0) throw new Error(`git status failed: ${status.stderr || status.stdout}`);
    if (status.stdout.trim()) {
      throw new Error(`refusing to release with a dirty working tree:\n${status.stdout}\nuse --force to override`);
    }
  }

  // 2. On the right branch?
  const head = await runner('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd });
  const current = head.stdout.trim();
  if (current !== branch) {
    throw new Error(`expected branch ${JSON.stringify(branch)}, got ${JSON.stringify(current)}; set RELEASE_BRANCH to override`);
  }

  // 3. Tag must not already exist.
  const tag = `v${version}`;
  const tagCheck = await runner('git', ['rev-parse', '-q', '--verify', `refs/tags/${tag}`], { cwd });
  if (tagCheck.code === 0) {
    throw new Error(`tag ${tag} already exists`);
  }

  // 4. Rewrite the three manifests.
  if (!dryRun) {
    const pkg = await readFile(paths.packageJson, 'utf8');
    await writeFile(paths.packageJson, rewritePackageJson(pkg, version));

    const tauri = await readFile(paths.tauriConf, 'utf8');
    await writeFile(paths.tauriConf, rewriteTauriConfJson(tauri, version));

    const cargo = await readFile(paths.cargoToml, 'utf8');
    await writeFile(paths.cargoToml, rewriteCargoToml(cargo, version));
  }

  // 5. Refresh Cargo.lock for `app` only. Skip on missing cargo (tauri-smoke catches drift later).
  const cargoUpdate = await runner('cargo',
    ['update', '-p', 'app', '--manifest-path', paths.cargoToml],
    { cwd });
  if (cargoUpdate.code !== 0 && cargoUpdate.code !== 127) {
    throw new Error(`cargo update failed: ${cargoUpdate.stderr || cargoUpdate.stdout}`);
  }

  if (dryRun) return;

  // 6. Stage the four files (three manifests + Cargo.lock).
  const cargoLock = join(dirname(paths.cargoToml), 'Cargo.lock');
  await runner('git', ['add', paths.packageJson, paths.tauriConf, paths.cargoToml, cargoLock], { cwd });

  // 7. Commit.
  await runner('git', ['commit', '-m', `chore: release ${tag}`], { cwd });

  // 8. Annotated tag.
  await runner('git', ['tag', '-a', tag, '-m', `Release ${tag}`], { cwd });
}

// CLI entry — only run when invoked directly.
if (isMainModule()) {
  const args = process.argv.slice(2);
  const version = args.find((a) => !a.startsWith('--'));
  const force = args.includes('--force');
  const dryRun = args.includes('--dry-run');

  const validated = validateVersion(version || '');
  if (!validated.ok) {
    console.error(`error: ${validated.error}`);
    console.error('usage: node scripts/release.mjs <version> [--force] [--dry-run]');
    process.exit(2);
  }

  try {
    await runRelease({ version: validated.version, force, dryRun });
    if (dryRun) {
      console.log(`(dry-run) would release v${validated.version}`);
    } else {
      console.log(`✓ release v${validated.version} committed and tagged`);
      console.log(`  next: git push --follow-tags`);
    }
  } catch (err) {
    console.error(`error: ${err.message}`);
    process.exit(1);
  }
}
