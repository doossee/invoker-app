import { describe, it, expect, afterEach } from 'vitest';
import { isTauri, isPublished } from './platform';

describe('isTauri', () => {
  // Each test mutates window — restore afterward so tests are independent.
  afterEach(() => {
    const w = window as unknown as Record<string, unknown>;
    delete w.__TAURI__;
    delete w.__TAURI_INTERNALS__;
    delete w.isTauri;
  });

  it('returns false in a plain browser environment', () => {
    expect(isTauri()).toBe(false);
  });

  it('returns true when window.__TAURI__ is set (Tauri v1 legacy)', () => {
    (window as unknown as Record<string, unknown>).__TAURI__ = {};
    expect(isTauri()).toBe(true);
  });

  it('returns true when window.__TAURI_INTERNALS__ is set (Tauri v2 IPC bridge)', () => {
    // This is the actual signal in Tauri 2 — the runtime injects
    // __TAURI_INTERNALS__ for the JS↔Rust IPC bridge. Without detecting it,
    // Tauri 2 desktop builds silently fall through to the browser path
    // (causing "Open folder → no reaction" UX bugs).
    (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__ = {};
    expect(isTauri()).toBe(true);
  });

  it('returns true when window.isTauri is true (Tauri v2 official flag)', () => {
    // Tauri 2 also sets window.isTauri = true at startup as the public
    // detection signal — same convention used by @tauri-apps/api's own check.
    (window as unknown as Record<string, unknown>).isTauri = true;
    expect(isTauri()).toBe(true);
  });

  it('returns false when window.isTauri is set but falsy', () => {
    (window as unknown as Record<string, unknown>).isTauri = false;
    expect(isTauri()).toBe(false);
  });
});

describe('isPublished', () => {
  afterEach(() => {
    delete (window as unknown as Record<string, unknown>).__INVOKER_PUBLISHED__;
  });

  it('returns false in a plain browser environment', () => {
    expect(isPublished()).toBe(false);
  });

  it('returns true when window.__INVOKER_PUBLISHED__ is injected', () => {
    (window as unknown as Record<string, unknown>).__INVOKER_PUBLISHED__ = true;
    expect(isPublished()).toBe(true);
  });
});
