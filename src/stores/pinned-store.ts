// src/stores/pinned-store.ts
import { create } from 'zustand';

/**
 * User-curated pinned paths for the dashboard's Pinned column.
 *
 * Pins are personal preferences — stored in `localStorage` keyed per
 * collection path (`invoker.pins.<collectionPath>`). Migrating to a
 * per-collection git-syncable file (e.g. `.invoker/pinned.json`) is a
 * future option, not part of this redesign.
 *
 * Corruption defence: any non-array / unparseable JSON resets to `[]`
 * (matches the editor-store load helpers from PR #78/#79).
 */

const STORAGE_PREFIX = 'invoker.pins.';

function storageKey(collectionPath: string): string {
  return `${STORAGE_PREFIX}${collectionPath}`;
}

function loadPins(collectionPath: string): string[] {
  try {
    const raw = localStorage.getItem(storageKey(collectionPath));
    if (raw === null) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((p): p is string => typeof p === 'string');
  } catch {
    return [];
  }
}

function savePins(collectionPath: string, pins: string[]): void {
  try {
    localStorage.setItem(storageKey(collectionPath), JSON.stringify(pins));
  } catch {
    // Quota exceeded / disabled — UI still works in-memory for the session.
  }
}

interface PinnedState {
  pinnedPaths: string[];
  collectionPath: string | null;
  pin: (path: string) => void;
  unpin: (path: string) => void;
  togglePin: (path: string) => void;
  isPinned: (path: string) => boolean;
  /** Switches the active collection. Rehydrates pins from the new key,
   *  or clears them if `null`. */
  setCollectionPath: (path: string | null) => void;
}

export const usePinnedStore = create<PinnedState>((set, get) => ({
  pinnedPaths: [],
  collectionPath: null,

  pin: (path) =>
    set((state) => {
      if (state.pinnedPaths.includes(path)) return state;
      const next = [...state.pinnedPaths, path];
      if (state.collectionPath !== null) savePins(state.collectionPath, next);
      return { pinnedPaths: next };
    }),

  unpin: (path) =>
    set((state) => {
      if (!state.pinnedPaths.includes(path)) return state;
      const next = state.pinnedPaths.filter((p) => p !== path);
      if (state.collectionPath !== null) savePins(state.collectionPath, next);
      return { pinnedPaths: next };
    }),

  togglePin: (path) => {
    const { isPinned, pin, unpin } = get();
    if (isPinned(path)) unpin(path);
    else pin(path);
  },

  isPinned: (path) => get().pinnedPaths.includes(path),

  setCollectionPath: (path) => {
    if (path === null) {
      set({ collectionPath: null, pinnedPaths: [] });
      return;
    }
    set({ collectionPath: path, pinnedPaths: loadPins(path) });
  },
}));
