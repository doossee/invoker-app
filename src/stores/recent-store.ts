// src/stores/recent-store.ts
import { create } from 'zustand';

/**
 * LRU tracker for recently opened paths. Powers the dashboard's
 * Recent column.
 *
 * Per-collection localStorage key: `invoker.recent.<collectionPath>`.
 * Capped at `RECENT_CAPACITY` (15) entries, head is most recent.
 *
 * A `clear()` action is intentionally omitted — there's no UI surface
 * for it in this redesign and YAGNI applies.
 */

export interface RecentEntry {
  path: string;
  openedAt: number;
}

const STORAGE_PREFIX = 'invoker.recent.';
const RECENT_CAPACITY = 15;

function storageKey(collectionPath: string): string {
  return `${STORAGE_PREFIX}${collectionPath}`;
}

function isValidEntry(v: unknown): v is RecentEntry {
  return (
    typeof v === 'object' &&
    v !== null &&
    typeof (v as RecentEntry).path === 'string' &&
    typeof (v as RecentEntry).openedAt === 'number'
  );
}

function loadRecent(collectionPath: string): RecentEntry[] {
  try {
    const raw = localStorage.getItem(storageKey(collectionPath));
    if (raw === null) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidEntry).slice(0, RECENT_CAPACITY);
  } catch {
    return [];
  }
}

function saveRecent(collectionPath: string, recent: RecentEntry[]): void {
  try {
    localStorage.setItem(storageKey(collectionPath), JSON.stringify(recent));
  } catch {
    // Quota exceeded / disabled — UI still works in-memory.
  }
}

interface RecentState {
  recent: RecentEntry[];
  collectionPath: string | null;
  /** Move `path` to the head of the recent list (or insert if absent),
   *  trim to capacity, persist. No-op if no collection is set. */
  markOpened: (path: string) => void;
  /** Switch collection — rehydrate from new localStorage key. `null`
   *  clears in-memory state without writing. */
  setCollectionPath: (path: string | null) => void;
}

export const useRecentStore = create<RecentState>((set) => ({
  recent: [],
  collectionPath: null,

  markOpened: (path) =>
    set((state) => {
      if (state.collectionPath === null) return state;
      const without = state.recent.filter((r) => r.path !== path);
      const next = [{ path, openedAt: Date.now() }, ...without].slice(
        0,
        RECENT_CAPACITY,
      );
      saveRecent(state.collectionPath, next);
      return { recent: next };
    }),

  setCollectionPath: (path) => {
    if (path === null) {
      set({ collectionPath: null, recent: [] });
      return;
    }
    set({ collectionPath: path, recent: loadRecent(path) });
  },
}));
