#!/usr/bin/env node
// release.mjs — sync version across package.json / tauri.conf.json / Cargo.toml
// and create a release commit + tag. Does NOT push — prints the push command.
//
// Usage: node scripts/release.mjs <version>
//   --force         skip dirty-tree refusal
//   --dry-run       print intended actions without touching anything
// Env:
//   RELEASE_BRANCH  override required branch name (default: main)

const SEMVER_RE = /^v?(\d+\.\d+\.\d+(?:-[\w.]+)?)$/;

/**
 * Validate a user-supplied version string. Strips a leading 'v' if present.
 * Returns { ok: true, version } on success or { ok: false, error } on failure.
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

/**
 * Rewrite package.json, preserving formatting (2-space indent, trailing newline).
 * `before` is the raw file contents as a string.
 */
export function rewritePackageJson(before, version) {
  const obj = JSON.parse(before);
  obj.version = version;
  const trailing = before.endsWith('\n') ? '\n' : '';
  return JSON.stringify(obj, null, 2) + trailing;
}

/**
 * Rewrite Tauri's config JSON. Same shape as package.json — top-level "version".
 */
export function rewriteTauriConfJson(before, version) {
  const obj = JSON.parse(before);
  obj.version = version;
  const trailing = before.endsWith('\n') ? '\n' : '';
  return JSON.stringify(obj, null, 2) + trailing;
}

/**
 * Rewrite Cargo.toml's [package] version, leaving [dependencies] untouched.
 *
 * We do line-based rewriting (not full TOML parsing) to:
 *   1. avoid pulling in a TOML dep just for one substitution
 *   2. preserve comments and formatting exactly
 *
 * The regex anchors to the start of a [package] section header and the FIRST
 * `version = "..."` line that follows, before any other section header.
 */
export function rewriteCargoToml(before, version) {
  const lines = before.split('\n');
  let inPackage = false;
  let updated = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*\[package\]\s*$/.test(line)) {
      inPackage = true;
      continue;
    }
    // Any other section header ends [package].
    if (inPackage && /^\s*\[[^\]]+\]\s*$/.test(line)) {
      inPackage = false;
      continue;
    }
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

// CLI entry — only run when invoked directly, not on import (tests import this file).
if (import.meta.url === `file://${process.argv[1]}`) {
  const arg = process.argv[2];
  const result = validateVersion(arg);
  if (!result.ok) {
    console.error(`error: ${result.error}`);
    process.exit(2);
  }
  console.log(`would release v${result.version}`);
}
