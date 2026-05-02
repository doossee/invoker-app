import { describe, it, expect, afterEach } from 'vitest';
import { isTauri, isPublished } from './platform';

describe('isTauri', () => {
  // Each test mutates window — restore afterward so tests are independent.
  afterEach(() => {
    delete (window as unknown as Record<string, unknown>).__TAURI__;
  });

  it('returns false in a plain browser environment', () => {
    expect(isTauri()).toBe(false);
  });

  it('returns true when window.__TAURI__ is set (any value)', () => {
    (window as unknown as Record<string, unknown>).__TAURI__ = {};
    expect(isTauri()).toBe(true);
  });

  it('returns true even if __TAURI__ is falsy (presence-only check)', () => {
    // Tauri 2 sometimes sets __TAURI__ to undefined as a marker. The check
    // is deliberately presence-based ('in' operator) so we still detect it.
    (window as unknown as Record<string, unknown>).__TAURI__ = undefined;
    expect(isTauri()).toBe(true);
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
