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
