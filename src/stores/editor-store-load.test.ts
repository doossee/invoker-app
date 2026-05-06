/**
 * Regression: editor-store's localStorage load path used
 * `Number(localStorage.getItem(k)) || N` and `localStorage.getItem(k)
 * as Foo`. Both forms trusted whatever was stored — a hand-edit (or
 * a buggy past version) writing `-99`, `99999`, or `"garbage"`
 * propagated unchecked into every consumer.
 *
 * Concrete failure modes that previously slipped through:
 *   - `defaultTimeoutSec = -99`  → Number(-99) || 30 = -99 (truthy
 *     fallback only fires on 0/NaN), abort timer fires immediately
 *   - `sidebarWidth = -50`       → sidebar rendered with negative
 *     width, hiding the file tree
 *   - `splitDirection = "diagonal"` → unrecognised string passed to
 *     CSS, layout breaks
 *   - `defaultRequestMethod = "PATCHX"` → method string silently
 *     accepted, request goes out with bogus method
 *
 * Fix: `loadInt(key, def, min, max)` + `loadEnum(key, allowed, def)`
 * helpers validate + clamp at load time. Tests below cover each
 * boundary.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

async function freshStore() {
  vi.resetModules();
  const mod = await import('./editor-store');
  return mod.useEditorStore;
}

describe('editor-store loadInt clamping', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('clamps a negative stored timeout up to the floor', async () => {
    localStorage.setItem('invoker:default-timeout-sec', '-99');
    const store = await freshStore();
    expect(store.getState().defaultTimeoutSec).toBe(1);
  });

  it('clamps an absurd stored timeout down to the ceiling', async () => {
    localStorage.setItem('invoker:default-timeout-sec', '99999');
    const store = await freshStore();
    expect(store.getState().defaultTimeoutSec).toBe(600);
  });

  it('falls back to the default when stored timeout is non-numeric', async () => {
    localStorage.setItem('invoker:default-timeout-sec', 'garbage');
    const store = await freshStore();
    expect(store.getState().defaultTimeoutSec).toBe(30);
  });

  it('clamps a negative sidebar width up to the floor', async () => {
    localStorage.setItem('invoker:sidebar-width', '-50');
    const store = await freshStore();
    expect(store.getState().sidebarWidth).toBe(180);
  });

  it('clamps an enormous sidebar width down to the ceiling', async () => {
    localStorage.setItem('invoker:sidebar-width', '99999');
    const store = await freshStore();
    expect(store.getState().sidebarWidth).toBe(600);
  });

  it('keeps a valid stored sidebar width', async () => {
    localStorage.setItem('invoker:sidebar-width', '320');
    const store = await freshStore();
    expect(store.getState().sidebarWidth).toBe(320);
  });

  it('keeps a valid stored response height', async () => {
    localStorage.setItem('invoker:response-height', '250');
    const store = await freshStore();
    expect(store.getState().responseHeight).toBe(250);
  });

  it('clamps response height to its range', async () => {
    localStorage.setItem('invoker:response-height', '-1');
    const store = await freshStore();
    expect(store.getState().responseHeight).toBe(120);
    localStorage.setItem('invoker:response-height', '99999');
    const store2 = await freshStore();
    expect(store2.getState().responseHeight).toBe(800);
  });
});

describe('editor-store loadEnum validation', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('rejects an unknown splitDirection value', async () => {
    localStorage.setItem('invoker:split-direction', 'diagonal');
    const store = await freshStore();
    expect(store.getState().splitDirection).toBe('horizontal');
  });

  it('keeps a valid splitDirection', async () => {
    localStorage.setItem('invoker:split-direction', 'vertical');
    const store = await freshStore();
    expect(store.getState().splitDirection).toBe('vertical');
  });

  it('rejects an unknown defaultRequestMethod value', async () => {
    localStorage.setItem('invoker:default-request-method', 'PATCHX');
    const store = await freshStore();
    expect(store.getState().defaultRequestMethod).toBe('GET');
  });

  it('keeps a valid defaultRequestMethod (POST)', async () => {
    localStorage.setItem('invoker:default-request-method', 'POST');
    const store = await freshStore();
    expect(store.getState().defaultRequestMethod).toBe('POST');
  });
});
