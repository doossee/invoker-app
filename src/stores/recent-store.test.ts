// src/stores/recent-store.test.ts
/**
 * recent-store — LRU tracker for recently opened paths.
 *
 * Per-collection localStorage key: `invoker.recent.<collectionPath>`.
 * Capped at 15 entries; head is most recent. markOpened with an existing
 * path moves it to the head (no duplicates).
 *
 * Corrupted JSON → start empty.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

async function freshStore() {
  vi.resetModules();
  const mod = await import('./recent-store');
  return mod.useRecentStore;
}

describe('recent-store', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-07T10:00:00Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it('starts with empty recent list', async () => {
    const useStore = await freshStore();
    expect(useStore.getState().recent).toEqual([]);
  });

  it('markOpened adds new path at the head with current timestamp', async () => {
    const useStore = await freshStore();
    useStore.getState().setCollectionPath('/x');
    useStore.getState().markOpened('a.ivk');
    expect(useStore.getState().recent).toEqual([
      { path: 'a.ivk', openedAt: Date.now() },
    ]);
  });

  it('markOpened moves an existing entry to the head with updated timestamp', async () => {
    const useStore = await freshStore();
    useStore.getState().setCollectionPath('/x');
    useStore.getState().markOpened('a.ivk');
    vi.advanceTimersByTime(1_000);
    useStore.getState().markOpened('b.ivk');
    vi.advanceTimersByTime(1_000);
    useStore.getState().markOpened('a.ivk');
    const recent = useStore.getState().recent;
    expect(recent.map((r) => r.path)).toEqual(['a.ivk', 'b.ivk']);
    expect(recent[0].openedAt).toBeGreaterThan(recent[1].openedAt);
  });

  it('caps recent list at 15 (oldest evicted)', async () => {
    const useStore = await freshStore();
    useStore.getState().setCollectionPath('/x');
    for (let i = 0; i < 20; i++) {
      vi.advanceTimersByTime(1_000);
      useStore.getState().markOpened(`f${i}.ivk`);
    }
    const recent = useStore.getState().recent;
    expect(recent).toHaveLength(15);
    expect(recent[0].path).toBe('f19.ivk');
    expect(recent[14].path).toBe('f5.ivk');
  });

  it('persists recent list to localStorage under per-collection key', async () => {
    const useStore = await freshStore();
    useStore.getState().setCollectionPath('/x');
    useStore.getState().markOpened('a.ivk');
    const stored = localStorage.getItem('invoker.recent./x');
    expect(stored).not.toBeNull();
    expect(JSON.parse(stored!)).toEqual([{ path: 'a.ivk', openedAt: Date.now() }]);
  });

  it('rehydrates from localStorage on setCollectionPath', async () => {
    localStorage.setItem(
      'invoker.recent./y',
      JSON.stringify([{ path: 'z.ivk', openedAt: 12345 }]),
    );
    const useStore = await freshStore();
    useStore.getState().setCollectionPath('/y');
    expect(useStore.getState().recent).toEqual([{ path: 'z.ivk', openedAt: 12345 }]);
  });

  it('switching collections swaps the visible recent list', async () => {
    localStorage.setItem(
      'invoker.recent./a',
      JSON.stringify([{ path: 'one.ivk', openedAt: 1 }]),
    );
    localStorage.setItem(
      'invoker.recent./b',
      JSON.stringify([{ path: 'two.ivk', openedAt: 2 }]),
    );
    const useStore = await freshStore();
    useStore.getState().setCollectionPath('/a');
    expect(useStore.getState().recent.map((r) => r.path)).toEqual(['one.ivk']);
    useStore.getState().setCollectionPath('/b');
    expect(useStore.getState().recent.map((r) => r.path)).toEqual(['two.ivk']);
  });

  it('setCollectionPath(null) clears the in-memory recent list', async () => {
    const useStore = await freshStore();
    useStore.getState().setCollectionPath('/a');
    useStore.getState().markOpened('x.ivk');
    useStore.getState().setCollectionPath(null);
    expect(useStore.getState().recent).toEqual([]);
  });

  it('corrupted JSON → start empty', async () => {
    localStorage.setItem('invoker.recent./x', '{not json');
    const useStore = await freshStore();
    expect(() => useStore.getState().setCollectionPath('/x')).not.toThrow();
    expect(useStore.getState().recent).toEqual([]);
  });

  it('non-array JSON → start empty', async () => {
    localStorage.setItem('invoker.recent./x', JSON.stringify({ not: 'array' }));
    const useStore = await freshStore();
    useStore.getState().setCollectionPath('/x');
    expect(useStore.getState().recent).toEqual([]);
  });

  it('drops malformed entries on rehydrate (defensive)', async () => {
    localStorage.setItem(
      'invoker.recent./x',
      JSON.stringify([
        { path: 'good.ivk', openedAt: 100 },
        { path: 42 },                    // bad: openedAt missing, path not a string
        'string-not-object',             // bad: not an object
        { openedAt: 200 },               // bad: path missing
        { path: 'also-good.ivk', openedAt: 300 },
      ]),
    );
    const useStore = await freshStore();
    useStore.getState().setCollectionPath('/x');
    expect(useStore.getState().recent.map((r) => r.path)).toEqual([
      'good.ivk',
      'also-good.ivk',
    ]);
  });
});
