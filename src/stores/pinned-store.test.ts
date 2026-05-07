// src/stores/pinned-store.test.ts
/**
 * pinned-store — user-curated pins for the dashboard's Pinned column.
 *
 * Per-collection localStorage key: `invoker.pins.<collectionPath>`.
 * Switching collections via `setCollectionPath` rehydrates from the new key.
 * Corrupted JSON → start empty (matches PR #78/#79 corruption-defense pattern).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

async function freshStore() {
  vi.resetModules();
  const mod = await import('./pinned-store');
  return mod.usePinnedStore;
}

describe('pinned-store', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    localStorage.clear();
  });

  it('starts with empty pinnedPaths and no collection', async () => {
    const useStore = await freshStore();
    expect(useStore.getState().pinnedPaths).toEqual([]);
  });

  it('pin adds path; unpin removes it; togglePin flips', async () => {
    const useStore = await freshStore();
    useStore.getState().setCollectionPath('/x');
    useStore.getState().pin('a/req.ivk');
    expect(useStore.getState().pinnedPaths).toEqual(['a/req.ivk']);
    useStore.getState().pin('b/req.ivk');
    expect(useStore.getState().pinnedPaths).toEqual(['a/req.ivk', 'b/req.ivk']);
    useStore.getState().togglePin('a/req.ivk');
    expect(useStore.getState().pinnedPaths).toEqual(['b/req.ivk']);
    useStore.getState().togglePin('a/req.ivk');
    expect(useStore.getState().pinnedPaths).toEqual(['b/req.ivk', 'a/req.ivk']);
  });

  it('isPinned reports membership', async () => {
    const useStore = await freshStore();
    useStore.getState().setCollectionPath('/x');
    useStore.getState().pin('a.ivk');
    expect(useStore.getState().isPinned('a.ivk')).toBe(true);
    expect(useStore.getState().isPinned('b.ivk')).toBe(false);
  });

  it('pin is idempotent (no duplicates)', async () => {
    const useStore = await freshStore();
    useStore.getState().setCollectionPath('/x');
    useStore.getState().pin('a.ivk');
    useStore.getState().pin('a.ivk');
    expect(useStore.getState().pinnedPaths).toEqual(['a.ivk']);
  });

  it('persists pins to localStorage under per-collection key', async () => {
    const useStore = await freshStore();
    useStore.getState().setCollectionPath('/x');
    useStore.getState().pin('a.ivk');
    expect(localStorage.getItem('invoker.pins./x')).toBe(JSON.stringify(['a.ivk']));
  });

  it('rehydrates from localStorage on setCollectionPath', async () => {
    localStorage.setItem('invoker.pins./y', JSON.stringify(['z.ivk', 'w.ivk']));
    const useStore = await freshStore();
    useStore.getState().setCollectionPath('/y');
    expect(useStore.getState().pinnedPaths).toEqual(['z.ivk', 'w.ivk']);
  });

  it('switching collections swaps the visible pins', async () => {
    localStorage.setItem('invoker.pins./a', JSON.stringify(['one.ivk']));
    localStorage.setItem('invoker.pins./b', JSON.stringify(['two.ivk']));
    const useStore = await freshStore();
    useStore.getState().setCollectionPath('/a');
    expect(useStore.getState().pinnedPaths).toEqual(['one.ivk']);
    useStore.getState().setCollectionPath('/b');
    expect(useStore.getState().pinnedPaths).toEqual(['two.ivk']);
  });

  it('setCollectionPath(null) clears the in-memory pins (no rehydrate)', async () => {
    const useStore = await freshStore();
    useStore.getState().setCollectionPath('/a');
    useStore.getState().pin('x.ivk');
    useStore.getState().setCollectionPath(null);
    expect(useStore.getState().pinnedPaths).toEqual([]);
  });

  it('corrupted JSON in localStorage → start empty (no throw)', async () => {
    localStorage.setItem('invoker.pins./x', '{not json');
    const useStore = await freshStore();
    expect(() => useStore.getState().setCollectionPath('/x')).not.toThrow();
    expect(useStore.getState().pinnedPaths).toEqual([]);
  });

  it('non-array JSON in localStorage → start empty', async () => {
    localStorage.setItem('invoker.pins./x', JSON.stringify({ not: 'an array' }));
    const useStore = await freshStore();
    useStore.getState().setCollectionPath('/x');
    expect(useStore.getState().pinnedPaths).toEqual([]);
  });
});
