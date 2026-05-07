# Sidebar + Dashboard Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the spec at `docs/superpowers/specs/2026-05-07-sidebar-and-dashboard-redesign-design.md` — drop the icon toolbar from PR #88, add labeled `+ New…` row + collection-header kebab, rewrite `CollectionDashboard` to a two-column **Pinned + Recent** layout, tone down `WelcomePage`, introduce `pinned-store` and `recent-store` keyed per-collection-path in `localStorage`.

**Architecture:** Two new Zustand stores following the existing `stores/` pattern (one concern per store, persisted via localStorage with corruption-safe load helpers like `editor-store.loadInt`/`loadEnum`). Sidebar refactor stays inside the existing `src/components/layout/Sidebar.tsx` file using subcomponents (matching `CollectionHeader`/`EnvFooter` style). Dashboard split into `PinnedColumn` + `RecentColumn` siblings inside `src/components/welcome/` to keep each file small.

**Tech Stack:** React + TypeScript + Zustand + Vite + vitest (jsdom + @testing-library/react) + Playwright for e2e. CSS-in-JS via inline `style={{...}}` + `TOKENS` design tokens from `src/components/shared/primitives.tsx`. No new dependencies.

---

## Pre-flight

- Branch off `stage`, not `main`. Spec lives on `docs/sidebar-dashboard-redesign-spec` (commit `b3cb6c9`); do **not** mix implementation onto that branch.
- Suggested branch name: `feat/sidebar-dashboard-redesign` (single PR) or split into `feat/pinned-recent-stores`, `feat/sidebar-redesign`, `feat/dashboard-redesign` if the executor prefers smaller PRs.
- Run `npm install` once if `node_modules` is fresh.
- Run `npm test` once before starting to confirm baseline 222 tests pass.

---

## Task 1: `pinned-store` — Zustand store for user-curated pins

**Files:**
- Create: `src/stores/pinned-store.ts`
- Test: `src/stores/pinned-store.test.ts`

The store holds an ordered list of pinned paths for the *current collection*. Persistence key is `invoker.pins.<collectionPath>`. Switching collections triggers a rehydrate from the new key.

- [ ] **Step 1.1: Write the failing test file**

```typescript
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
```

- [ ] **Step 1.2: Run the test file — expect failure ("Cannot find module ./pinned-store")**

```bash
cd /Users/dostonkamilov/Projects/invoker/invoker-app
npx vitest run src/stores/pinned-store.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 1.3: Implement `pinned-store.ts`**

```typescript
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
```

- [ ] **Step 1.4: Run the test file — expect 9 passing**

```bash
npx vitest run src/stores/pinned-store.test.ts
```

Expected: PASS — 9 tests in the file.

- [ ] **Step 1.5: Commit**

```bash
git add src/stores/pinned-store.ts src/stores/pinned-store.test.ts
git commit -m "feat(stores): add pinned-store for dashboard pinned column"
```

---

## Task 2: `recent-store` — LRU recent-opens tracker

**Files:**
- Create: `src/stores/recent-store.ts`
- Test: `src/stores/recent-store.test.ts`

LRU list of recently opened paths, capped at 15. Same per-collection localStorage key pattern as `pinned-store`.

- [ ] **Step 2.1: Write the failing test file**

```typescript
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
```

- [ ] **Step 2.2: Run the test file — expect failure**

```bash
npx vitest run src/stores/recent-store.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 2.3: Implement `recent-store.ts`**

```typescript
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

export const RECENT_CAPACITY_FOR_TESTS = RECENT_CAPACITY;
```

- [ ] **Step 2.4: Run the test file — expect 10 passing**

```bash
npx vitest run src/stores/recent-store.test.ts
```

Expected: PASS — 10 tests.

- [ ] **Step 2.5: Commit**

```bash
git add src/stores/recent-store.ts src/stores/recent-store.test.ts
git commit -m "feat(stores): add recent-store (LRU tracker, cap 15)"
```

---

## Task 3: Wire `recent-store.markOpened` into `editor-store.openTab`

**Files:**
- Modify: `src/stores/editor-store.ts:172-182` (the `openTab` action)
- Test: `src/stores/editor-store.test.ts` (extend)

`openTab` is the single funnel for opening a file (sidebar click, palette, recent click, pinned click). Calling `markOpened` here is the only wiring needed.

- [ ] **Step 3.1: Add a failing test to `editor-store.test.ts`**

Append this `describe` block at the bottom of `src/stores/editor-store.test.ts`:

```typescript
describe('editor-store / recent-store integration', () => {
  beforeEach(() => {
    localStorage.clear();
    useEditorStore.setState({ tabs: [], activeTabPath: null });
  });

  it('openTab marks the path as recently opened', async () => {
    const { useRecentStore } = await import('./recent-store');
    useRecentStore.getState().setCollectionPath('/test');

    useEditorStore.getState().openTab({
      kind: 'ivk',
      path: 'a/b.ivk',
      name: 'b',
    });

    expect(useRecentStore.getState().recent.map((r) => r.path)).toEqual([
      'a/b.ivk',
    ]);
  });

  it('openTab does NOT mark inline paths as recent', async () => {
    const { useRecentStore } = await import('./recent-store');
    useRecentStore.getState().setCollectionPath('/test');

    useEditorStore.getState().openTab({
      kind: 'ivk',
      path: 'inline/Untitled-abc.ivk',
      name: 'Untitled',
    });

    expect(useRecentStore.getState().recent).toEqual([]);
  });
});
```

(Make sure the file already imports `describe`, `it`, `expect`, `beforeEach`, and `useEditorStore`. If not, add them.)

- [ ] **Step 3.2: Run — expect failure**

```bash
npx vitest run src/stores/editor-store.test.ts -t "recent-store integration"
```

Expected: FAIL — `recent` stays empty.

- [ ] **Step 3.3: Modify `openTab` to call `markOpened`**

In `src/stores/editor-store.ts`, replace the existing `openTab` (around lines 172–182) with:

```typescript
  openTab: (tab) =>
    set((state) => {
      // Track the open in recent-store (skip ephemeral inline paths so
      // every "+ New request" doesn't pollute the dashboard).
      if (!tab.path.startsWith('inline/')) {
        // Lazy-import to avoid a static circular import (recent-store
        // doesn't know about editor-store; editor-store doesn't need
        // recent-store at module-load time).
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        import('./recent-store').then(({ useRecentStore }) => {
          useRecentStore.getState().markOpened(tab.path);
        });
      }
      const exists = state.tabs.find((t) => t.path === tab.path);
      if (exists) {
        return { activeTabPath: tab.path };
      }
      return {
        tabs: [...state.tabs, tab],
        activeTabPath: tab.path,
      };
    }),
```

- [ ] **Step 3.4: Run — expect both new tests pass**

```bash
npx vitest run src/stores/editor-store.test.ts -t "recent-store integration"
```

Expected: PASS — 2 tests.

- [ ] **Step 3.5: Run the full editor-store test suite to confirm no regressions**

```bash
npx vitest run src/stores/editor-store.test.ts
```

Expected: PASS — all tests (existing + 2 new).

- [ ] **Step 3.6: Commit**

```bash
git add src/stores/editor-store.ts src/stores/editor-store.test.ts
git commit -m "feat(editor-store): mark openTab paths in recent-store"
```

---

## Task 4: Wire collection-path subscription in `App.tsx`

**Files:**
- Modify: `src/App.tsx` (find the existing `loadCollection` effect)
- Test: `src/App.test.tsx` if it exists, otherwise skip (App.tsx integration is covered by the e2e in Task 16)

Both new stores need to know when the active collection changes so they swap localStorage keys. Per CLAUDE.md: "Cross-store coordination happens in `App.tsx` effects."

- [ ] **Step 4.1: Inspect current App.tsx around the collection-loading code**

```bash
cd /Users/dostonkamilov/Projects/invoker/invoker-app
grep -n "collectionPath\|loadCollection\|purgeStaleTabs" src/App.tsx | head -20
```

Use the line numbers to find the right effect (likely near the existing purgeStaleTabs / collection-load effect).

- [ ] **Step 4.2: Add a Zustand subscription in `App.tsx`**

In `src/App.tsx`, near the existing collection-store-driven effects, add:

```typescript
// Sync the per-collection stores (pinned + recent) whenever the active
// collection changes — both stores key their localStorage by collection
// path, so they need to rehydrate when the user switches folders.
import { usePinnedStore } from '@/stores/pinned-store';
import { useRecentStore } from '@/stores/recent-store';

// …inside the App component:
const collectionPath = useCollectionStore((s) => s.collectionPath);
useEffect(() => {
  usePinnedStore.getState().setCollectionPath(collectionPath);
  useRecentStore.getState().setCollectionPath(collectionPath);
}, [collectionPath]);
```

Place the `useEffect` next to the existing collection-driven effects (after `loadCollection` runs). Don't duplicate the import if `useCollectionStore` is already imported above.

- [ ] **Step 4.3: Type-check**

```bash
npx tsc --noEmit
```

Expected: no output (success).

- [ ] **Step 4.4: Run the full test suite**

```bash
npm test
```

Expected: PASS — no regressions.

- [ ] **Step 4.5: Commit**

```bash
git add src/App.tsx
git commit -m "feat(app): rehydrate pinned/recent stores on collection change"
```

---

## Task 5: `UnifiedTree` context menu — add Pin / Unpin item

**Files:**
- Modify: `src/components/collection/UnifiedTree.tsx` (the `ContextMenu` component, around lines 144–394)

The menu currently has Rename / Delete for `.ivk` and Create-trio for `folder` / `root`. Add Pin / Unpin to both `.ivk` and `folder` kinds (skip for `root` — there's no path to pin).

- [ ] **Step 5.1: Identify the existing context-menu render block**

In `src/components/collection/UnifiedTree.tsx`, find the JSX block around line 370 that conditionally renders Create vs Rename/Delete (lines 371–391 in the current source).

- [ ] **Step 5.2: Add `usePinnedStore` import + Pin handler at the top of `ContextMenu`**

At the top of `src/components/collection/UnifiedTree.tsx` (with the other store imports):

```typescript
import { usePinnedStore } from '@/stores/pinned-store';
import { Pin, PinOff } from 'lucide-react';
```

Inside the `ContextMenu` function (after the existing `createDoc` / `collectionPath` lines around line 152), add:

```typescript
  const togglePin = usePinnedStore((s) => s.togglePin);
  const isPinned = usePinnedStore((s) => s.isPinned);

  const handleTogglePin = () => {
    if (state?.kind !== 'ivk' && state?.kind !== 'folder') return;
    togglePin(state.path);
    onClose();
  };
```

- [ ] **Step 5.3: Render the Pin / Unpin item**

In the same file, find the JSX block that renders Rename/Delete for `state.kind === 'ivk'`. Add a Pin item just above Rename:

```tsx
      {state.kind === 'ivk' && (
        <>
          <MenuItem
            icon={isPinned(state.path) ? <PinOff size={11} /> : <Pin size={11} />}
            label={isPinned(state.path) ? 'Unpin' : 'Pin'}
            onClick={handleTogglePin}
          />
          <MenuItem icon={<Pencil size={11} />} label="Rename" onClick={handleRename} />
          <MenuItem
            icon={<Trash2 size={11} />}
            label="Delete"
            onClick={handleDelete}
            danger
          />
        </>
      )}
```

For folders, add Pin/Unpin between the Create trio and the close of the conditional block:

```tsx
      {(state.kind === 'folder' || state.kind === 'root') && (
        <>
          <MenuItem icon={<FilePlus size={11} />} label="New request" onClick={handleNewRequest} />
          <MenuItem icon={<BookOpen size={11} />} label="New doc" onClick={handleNewDoc} />
          <MenuItem icon={<FolderPlus size={11} />} label="New folder" onClick={handleNewFolder} />
          {state.kind === 'folder' && (
            <>
              <div style={{ height: 1, background: TOKENS.strokeSoft, margin: '4px 0' }} />
              <MenuItem
                icon={isPinned(state.path) ? <PinOff size={11} /> : <Pin size={11} />}
                label={isPinned(state.path) ? 'Unpin folder' : 'Pin folder'}
                onClick={handleTogglePin}
              />
            </>
          )}
        </>
      )}
```

- [ ] **Step 5.4: Type-check**

```bash
npx tsc --noEmit
```

Expected: no output.

- [ ] **Step 5.5: Run existing UnifiedTree e2e tests to verify nothing broke**

```bash
npx playwright test e2e/sidebar-create-menu.spec.ts --reporter=list
```

Expected: PASS — all 3 tests still green (we only added items; we didn't remove any).

- [ ] **Step 5.6: Commit**

```bash
git add src/components/collection/UnifiedTree.tsx
git commit -m "feat(tree): add Pin / Unpin to right-click context menu"
```

---

## Task 6: Sidebar — replace `SidebarToolbar` with `NewItemRow`

**Files:**
- Modify: `src/components/layout/Sidebar.tsx` — delete `SidebarToolbar` (lines ~574–853), add `NewItemRow` component

The `NewItemRow` keeps the existing popup (Request / Doc / Folder) and the existing handlers (`handleNewFile`, `handleNewDoc`, `handleNewFolder`) — just changes the *trigger* shape from a 3-icon row to a single full-width labeled row.

- [ ] **Step 6.1: Replace the `<SidebarToolbar />` render call with `<NewItemRow />`**

In `src/components/layout/Sidebar.tsx`, find this block (around line 124):

```typescript
      {/* Toolbar — VSCode Explorer style: file-system actions on the
          left, editor-only actions (palette / new inline tab) on the
          right separated by spacer. Hover-only highlight matches the
          rest of the sidebar. */}
      <SidebarToolbar />
```

Replace with:

```typescript
      {/* Single labeled "+ New…" row that opens a popup with Request /
          Doc / Folder. Refresh + collapse-all moved to the kebab on
          the collection header. */}
      <NewItemRow />
```

- [ ] **Step 6.2: Replace the entire `SidebarToolbar` function with `NewItemRow`**

Locate the `SidebarToolbar` function (the big one starting at the comment "Sidebar toolbar — VSCode Explorer style" around line 574). Delete that function AND its `ToolbarBtn` helper at the bottom (the very last function in the file). Keep `PopupItem` — it's reused.

In its place, paste this `NewItemRow` function. Place it where `SidebarToolbar` was:

```typescript
/* ------------------------------------------------------------------ */
/*  New-item row — single labeled trigger that opens a Request /      */
/*  Doc / Folder popup. Replaces the icon-cluster toolbar from #88.   */
/*  Handlers and copy match the right-click flow in UnifiedTree.      */
/* ------------------------------------------------------------------ */
function NewItemRow() {
  const createFile = useCollectionStore((s) => s.createFile);
  const createFolder = useCollectionStore((s) => s.createFolder);
  const createDoc = useDocsStore((s) => s.createDoc);
  const collectionPath = useCollectionStore((s) => s.collectionPath);
  const openTab = useEditorStore((s) => s.openTab);

  const handleNewFile = async () => {
    // eslint-disable-next-line no-alert
    const name = window.prompt('Name for the new request (without .ivk):', 'untitled');
    if (!name || !name.trim()) return;
    let newPath: string | null;
    try {
      newPath = await createFile('', name.trim());
    } catch (err) {
      // eslint-disable-next-line no-alert
      window.alert(`Couldn't create the request: ${err instanceof Error ? err.message : String(err)}`);
      return;
    }
    if (newPath === null) {
      // eslint-disable-next-line no-alert
      window.alert(`A request named "${name.trim()}" already exists at the collection root.`);
      return;
    }
    openTab({ kind: 'ivk', path: newPath, name: name.trim() });
  };

  const handleNewDoc = async () => {
    // eslint-disable-next-line no-alert
    const name = window.prompt('Name for the new doc (without .md):', 'untitled');
    if (!name || !name.trim()) return;
    let newPath: string | null;
    try {
      newPath = await createDoc('', name.trim(), collectionPath);
    } catch (err) {
      // eslint-disable-next-line no-alert
      window.alert(`Couldn't create the doc: ${err instanceof Error ? err.message : String(err)}`);
      return;
    }
    if (newPath === null) {
      // eslint-disable-next-line no-alert
      window.alert(`A doc named "${name.trim()}" already exists at the collection root.`);
      return;
    }
    openTab({ kind: 'doc', path: newPath, name: name.trim() });
  };

  const handleNewFolder = async () => {
    // eslint-disable-next-line no-alert
    const name = window.prompt('Name for the new folder:', 'untitled');
    if (!name || !name.trim() || name.includes('/')) {
      if (name && name.includes('/')) {
        // eslint-disable-next-line no-alert
        window.alert('Folder names cannot contain "/" — create a nested folder by right-clicking the new one after.');
      }
      return;
    }
    let newPath: string | null;
    try {
      newPath = await createFolder('', name.trim());
    } catch (err) {
      // eslint-disable-next-line no-alert
      window.alert(`Couldn't create the folder: ${err instanceof Error ? err.message : String(err)}`);
      return;
    }
    if (newPath === null) {
      // eslint-disable-next-line no-alert
      window.alert(`A folder named "${name.trim()}" already exists at the root.`);
      return;
    }
    await createDoc(newPath, 'README', collectionPath, `# ${name.trim()}\n`);
    useCollectionStore.getState().toggleFolder(newPath);
    openTab({ kind: 'folder', path: newPath, name: name.trim(), hasReadme: true });
  };

  const [popupOpen, setPopupOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!popupOpen) return;
    const onMouseDown = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setPopupOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPopupOpen(false);
    };
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [popupOpen]);

  const closeAnd = (fn: () => void | Promise<unknown>) => async () => {
    setPopupOpen(false);
    await fn();
  };

  return (
    <div ref={wrapperRef} style={{ padding: '4px 10px 6px', position: 'relative' }}>
      <button
        onClick={() => setPopupOpen((v) => !v)}
        aria-label="New… (request, doc, folder)"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          width: '100%',
          padding: '7px 8px',
          background: popupOpen ? 'rgba(255,255,255,0.06)' : 'transparent',
          border: 'none',
          borderRadius: 6,
          cursor: 'pointer',
          fontFamily: 'inherit',
          fontSize: 12,
          color: TOKENS.fg1,
          textAlign: 'left' as const,
        }}
        onMouseEnter={(e) => {
          if (!popupOpen) e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
        }}
        onMouseLeave={(e) => {
          if (!popupOpen) e.currentTarget.style.background = 'transparent';
        }}
      >
        <span
          style={{
            width: 16,
            height: 16,
            display: 'grid',
            placeItems: 'center',
            background: 'rgba(230,193,136,0.12)',
            color: TOKENS.amber,
            borderRadius: 4,
            fontSize: 12,
            lineHeight: 1,
          }}
        >
          +
        </span>
        <span>New…</span>
      </button>

      {popupOpen && (
        <div
          role="menu"
          style={{
            position: 'absolute',
            top: '100%',
            left: 10,
            right: 10,
            marginTop: 4,
            background: TOKENS.s2,
            borderRadius: 8,
            boxShadow: `inset 0 0 0 1px ${TOKENS.stroke}, 0 8px 24px rgba(0,0,0,0.4)`,
            padding: 4,
            fontFamily: 'inherit',
            fontSize: 12,
            zIndex: 100,
          }}
        >
          <PopupItem
            icon={<FilePlus size={12} />}
            label="New request"
            onClick={closeAnd(handleNewFile)}
          />
          <PopupItem
            icon={<BookOpen size={12} />}
            label="New doc"
            onClick={closeAnd(handleNewDoc)}
          />
          <PopupItem
            icon={<FolderPlus size={12} />}
            label="New folder"
            onClick={closeAnd(handleNewFolder)}
          />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 6.3: Remove the now-unused icon imports**

At the top of `Sidebar.tsx`, remove `Plus`, `RefreshCw`, `ChevronsDownUp` from the lucide-react import line if no other code in the file references them.

```bash
grep -nE '\b(Plus|RefreshCw|ChevronsDownUp)\b' src/components/layout/Sidebar.tsx
```

If only the import line matches, remove those three names from the import block.

- [ ] **Step 6.4: Type-check + run all tests**

```bash
npx tsc --noEmit && npm test
```

Expected: clean typecheck + tests still pass.

- [ ] **Step 6.5: Adapt `e2e/sidebar-create-menu.spec.ts` selectors**

The current spec uses `await page.getByRole('button', { name: /try sample/i }).first().click();` but also clicks via right-click on folders. Now there's an additional code path: the labeled `+ New…` row. The existing right-click tests still work. **Add a new test** to confirm the new row works:

Append to `e2e/sidebar-create-menu.spec.ts`:

```typescript
test('Sidebar "+ New…" row opens popup with Request / Doc / Folder', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
  });
  await page.goto('/');
  await page.getByRole('button', { name: /try sample/i }).first().click();
  await expect(page.getByText(/Sample collection/i).first()).toBeVisible();

  // Click the labeled "+ New…" row.
  await page.getByRole('button', { name: /^New… \(request, doc, folder\)$/ }).click();

  // All three create options visible in the popup.
  await expect(page.getByRole('menuitem', { name: /^New request$/ })).toBeVisible();
  await expect(page.getByRole('menuitem', { name: /^New doc$/ })).toBeVisible();
  await expect(page.getByRole('menuitem', { name: /^New folder$/ })).toBeVisible();
});
```

- [ ] **Step 6.6: Run e2e — expect 4 tests pass (3 existing + 1 new)**

```bash
npx playwright test e2e/sidebar-create-menu.spec.ts --reporter=list
```

Expected: PASS.

- [ ] **Step 6.7: Commit**

```bash
git add src/components/layout/Sidebar.tsx e2e/sidebar-create-menu.spec.ts
git commit -m "refactor(sidebar): replace icon toolbar with labeled '+ New…' row"
```

---

## Task 7: Sidebar — flatten search row + extend `CollectionHeader` with kebab

**Files:**
- Modify: `src/components/layout/Sidebar.tsx`

Two changes in one task because they both touch CollectionHeader / Search:

1. Drop the inset border + `s3` background from the search row (line 70–82-ish).
2. Add a kebab menu next to the existing chevron in `CollectionHeader` with three items: **Refresh from disk**, **Collapse all folders**, **Change folder…**.

- [ ] **Step 7.1: Flatten the search row**

In `src/components/layout/Sidebar.tsx`, find the search-bar div (around lines 70–82). Replace this:

```typescript
      <div style={{ padding: '0 10px 8px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 8px',
            background: TOKENS.s3,
            borderRadius: 7,
            boxShadow: `inset 0 0 0 1px ${TOKENS.strokeSoft}`,
            minWidth: 0,
          }}
        >
```

With:

```typescript
      <div style={{ padding: '0 10px 4px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 8px',
            background: 'transparent',
            borderRadius: 7,
            minWidth: 0,
          }}
        >
```

(Background → transparent, no boxShadow inset, slight padding tweak so the row sits closer to the divider.)

- [ ] **Step 7.2: Add a kebab handler + state to `CollectionHeader`**

In `CollectionHeader` (around lines 143–272), add new state and a kebab menu component. First, near the existing `useState(menuOpen)`:

```typescript
  const [kebabOpen, setKebabOpen] = useState(false);
  const kebabRef = useRef<HTMLDivElement | null>(null);

  // Click-outside / Escape for the kebab.
  useEffect(() => {
    if (!kebabOpen) return;
    const onMouseDown = (e: MouseEvent) => {
      if (!kebabRef.current?.contains(e.target as Node)) setKebabOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setKebabOpen(false);
    };
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [kebabOpen]);
```

Then add the handler functions just inside `CollectionHeader`, AFTER the existing `useMemo` block:

```typescript
  // Kebab actions — these used to live in the SidebarToolbar (PR #88).
  const collapseAllFolders = useCollectionStore((s) => s.collapseAllFolders);
  const setCollectionPath = useCollectionStore((s) => s.setCollectionPath);
  const loadCollectionToStore = useCollectionStore((s) => s.loadCollection);
  const loadDocsToStore = useDocsStore((s) => s.loadDocs);

  const handleRefresh = async () => {
    setKebabOpen(false);
    if (!isTauri() || !collectionPath || collectionPath === '(sample)' || collectionPath === '(published)') {
      return;
    }
    try {
      const data = await loadFromDisk(collectionPath);
      loadCollectionToStore({ ivkFiles: data.ivkFiles, basePath: data.basePath });
      setCollectionPath(collectionPath);
      loadDocsToStore(data.mdFiles);
    } catch (err) {
      // eslint-disable-next-line no-alert
      window.alert(`Refresh failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };
  const handleCollapseAll = () => {
    setKebabOpen(false);
    collapseAllFolders();
  };
```

For the "Change folder…" item, reuse the existing CollectionDropdown by opening that menu — or just trigger the same `useOpenCollection` hook used in `CollectionDropdown`. Simplest: include it in the kebab menu alongside an `openCollection` trigger.

- [ ] **Step 7.3: Add the kebab `<MoreVertical />` button + dropdown JSX**

Update the import block at the top of `Sidebar.tsx` to include `MoreVertical`:

```typescript
import {
  // …existing imports…
  MoreVertical,
} from 'lucide-react';
```

Inside `CollectionHeader`'s JSX (around the `PanelLeftClose` button at lines 240–267), add a new sibling button JUST BEFORE the `PanelLeftClose` button:

```tsx
      {/* Kebab — collection-level actions (refresh, collapse all,
          change folder). Replaces the icon toolbar from #88. */}
      <div ref={kebabRef} style={{ position: 'absolute', top: 14, right: 40 }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setKebabOpen((v) => !v);
          }}
          title="Collection actions"
          aria-label="Collection actions"
          style={{
            width: 22,
            height: 22,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: kebabOpen ? TOKENS.s3 : 'transparent',
            border: 'none',
            borderRadius: 5,
            color: TOKENS.fg2,
            cursor: 'pointer',
          }}
        >
          <MoreVertical size={13} />
        </button>
        {kebabOpen && <KebabMenu onClose={() => setKebabOpen(false)} onRefresh={handleRefresh} onCollapseAll={handleCollapseAll} />}
      </div>
```

- [ ] **Step 7.4: Define the `KebabMenu` subcomponent**

Add this function next to `CollectionDropdown` in `Sidebar.tsx`:

```typescript
function KebabMenu({
  onClose,
  onRefresh,
  onCollapseAll,
}: {
  onClose: () => void;
  onRefresh: () => void;
  onCollapseAll: () => void;
}) {
  const { openCollection, loading, canOpenFolder } = useOpenCollection();
  return (
    <div
      style={{
        position: 'absolute',
        top: '100%',
        right: 0,
        marginTop: 4,
        minWidth: 180,
        background: TOKENS.s1,
        border: `1px solid ${TOKENS.fg4}`,
        borderRadius: 8,
        padding: 4,
        boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
        zIndex: 60,
      }}
    >
      <DropdownButton
        icon={<RefreshCw size={12} style={{ color: TOKENS.fg2 }} />}
        label="Refresh from disk"
        onClick={onRefresh}
      />
      <DropdownButton
        icon={<ChevronsDownUp size={12} style={{ color: TOKENS.fg2 }} />}
        label="Collapse all folders"
        onClick={onCollapseAll}
      />
      <div style={{ height: 1, background: TOKENS.strokeSoft, margin: '4px 0' }} />
      <DropdownButton
        icon={<FolderOpen size={12} style={{ color: TOKENS.amber }} />}
        label={canOpenFolder ? 'Change folder…' : 'Change folder (unavailable)'}
        disabled={!canOpenFolder || loading}
        onClick={async () => {
          await openCollection();
          onClose();
        }}
      />
    </div>
  );
}
```

(`RefreshCw` and `ChevronsDownUp` need to be added back to the lucide-react import block — they were removed in Task 6's cleanup.)

- [ ] **Step 7.5: Type-check + tests**

```bash
npx tsc --noEmit && npm test
```

Expected: clean.

- [ ] **Step 7.6: Manual smoke (just bring up dev server briefly)**

```bash
npm run dev &
sleep 3
# Then open browser to http://localhost:5173, load sample, verify:
#  - Search row has no border
#  - Kebab button shows next to the panel-left-close icon
#  - Click kebab: shows Refresh / Collapse all / Change folder
#  - Click each item: works
# Then kill the dev server.
```

(This is a manual sanity check; e2e for the kebab is in Task 16.)

- [ ] **Step 7.7: Commit**

```bash
git add src/components/layout/Sidebar.tsx
git commit -m "feat(sidebar): flatten search row + add kebab to collection header"
```

---

## Task 8: Sidebar — empty-state branch (`EmptySidebar`)

**Files:**
- Modify: `src/components/layout/Sidebar.tsx`

When `collectionPath === null` (no collection loaded), render a minimal sidebar: header (using existing CollectionHeader, which already shows "No collection / Open a folder to start") + one-line hint where the tree would be + footer.

- [ ] **Step 8.1: Branch in the top-level `Sidebar` render**

In `src/components/layout/Sidebar.tsx`, find the top of the `Sidebar` function. Add:

```typescript
export function Sidebar({ children, onOpenSettings, searchQuery, onSearchChange }: Props) {
  const setEnvSettingsOpen = useEditorStore((s) => s.setEnvSettingsOpen);
  const sidebarWidth = useEditorStore((s) => s.sidebarWidth);
  const collectionPath = useCollectionStore((s) => s.collectionPath);
  const filesCount = useCollectionStore((s) => s.files.length);
  const docsCount = useDocsStore((s) => s.docs.length);
  // No collection AND no in-memory files (sample / inline) → render the
  // minimal empty-state sidebar.
  const isEmpty = !collectionPath && filesCount === 0 && docsCount === 0;
  if (isEmpty) {
    return <EmptySidebar onOpenSettings={onOpenSettings} setEnvSettingsOpen={setEnvSettingsOpen} />;
  }
  const showKbdHint = sidebarWidth >= 230;
  // …rest unchanged
```

- [ ] **Step 8.2: Define `EmptySidebar` at the bottom of the file**

```typescript
/* ------------------------------------------------------------------ */
/*  Empty-state sidebar — header + one-line hint + footer.            */
/*  All "Open folder" / "Try sample" CTAs live in WelcomePage to      */
/*  avoid two parallel paths to the same actions in one viewport.    */
/* ------------------------------------------------------------------ */
function EmptySidebar({
  onOpenSettings,
  setEnvSettingsOpen,
}: {
  onOpenSettings: () => void;
  setEnvSettingsOpen: (open: boolean) => void;
}) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: TOKENS.s2,
        borderRadius: 14,
        boxShadow: `inset 0 0 0 1px ${TOKENS.stroke}`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <CollectionHeader />
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 16px',
          textAlign: 'center' as const,
          fontSize: 11,
          color: TOKENS.fg3,
          lineHeight: 1.5,
        }}
      >
        Open a folder from the welcome screen.
      </div>
      <EnvFooter
        onOpenSettings={onOpenSettings}
        onManageEnv={() => setEnvSettingsOpen(true)}
      />
    </div>
  );
}
```

- [ ] **Step 8.3: Type-check**

```bash
npx tsc --noEmit
```

Expected: clean.

- [ ] **Step 8.4: Manual smoke**

```bash
npm run dev
# In browser at :5173: clear localStorage to force the no-collection state
# (Settings → Reset, or DevTools → Application → Clear storage). Verify:
#  - Sidebar shows: "No collection / Open a folder to start" header
#  - Middle area shows "Open a folder from the welcome screen."
#  - No search row, no "+ New…", no tree
#  - Footer (env pill + settings) still visible
```

- [ ] **Step 8.5: Commit**

```bash
git add src/components/layout/Sidebar.tsx
git commit -m "feat(sidebar): minimal empty-state branch (header + hint + footer)"
```

---

## Task 9: `TileHeader` — swap JetBrains Mono for Inter small-caps

**Files:**
- Modify: `src/components/shared/primitives.tsx` (the `TileHeader` function around line 226)

Per the spec's typography goal: drop mono caps from non-code labels. Inter small-caps + bold replaces it.

- [ ] **Step 9.1: Find the existing `TileHeader`**

```bash
grep -n "function TileHeader" src/components/shared/primitives.tsx
```

Expected: line 226.

- [ ] **Step 9.2: Replace the function**

Find this:

```typescript
export function TileHeader({ icon, label }: { icon: ReactNode; label: string }) {
```

Replace the entire function body with:

```typescript
export function TileHeader({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontFamily: "'Inter', system-ui, sans-serif",
        fontSize: 11,
        fontWeight: 600,
        color: TOKENS.fg3,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
      }}
    >
      <span style={{ color: TOKENS.amber, display: 'flex' }}>{icon}</span>
      <span>{label}</span>
    </div>
  );
}
```

(Same structure, no JetBrains Mono. Letter-spacing slightly tighter since Inter at this size doesn't need as much.)

- [ ] **Step 9.3: Run primitives tests**

```bash
npx vitest run src/components/shared/primitives.test.tsx
```

Expected: PASS — TileHeader renders text + icon, that's all the existing test asserts. (If there's no test for TileHeader yet, that's OK — visual change only.)

- [ ] **Step 9.4: Commit**

```bash
git add src/components/shared/primitives.tsx
git commit -m "refactor(primitives): TileHeader uses Inter small-caps not Mono"
```

---

## Task 10: `WelcomePage` — tone down hero, drop top-right CTAs

**Files:**
- Modify: `src/components/welcome/WelcomePage.tsx`

Three changes:
1. Logo tile 56px → 40px.
2. Headline 34px / 700 → 26px / 600. Tagline 15px → 13px.
3. Remove the top-right `[Docs]` + `[+ New request]` buttons.
4. The `LEARN · 3 MIN` divider's mono span becomes Inter small-caps (matches TileHeader change).

- [ ] **Step 10.1: Apply the hero size changes**

In `src/components/welcome/WelcomePage.tsx`, find the hero block (around lines 73–115). Update:

```typescript
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 36 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              background: 'rgba(230,193,136,0.08)',
              boxShadow: `inset 0 0 0 1px ${TOKENS.strokeHot}`,
            }}
          >
            <InvokerMark size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontFamily: "'Manrope', sans-serif",
                fontWeight: 600,
                fontSize: 26,
                letterSpacing: '-0.02em',
                lineHeight: 1.15,
                color: TOKENS.fg1,
              }}
            >
              {/* …existing headline children… */}
            </div>
            {/* …existing tagline div, change fontSize from 15 to 13… */}
          </div>
        </div>
```

The headline children (the actual text) stays the same. Just adjust the wrapping styles.

- [ ] **Step 10.2: Remove the top-right CTAs**

Look for the JSX block immediately after the hero where two buttons render (a `<GhostBtn>` for Docs and a `<PrimaryBtn>` for "+ New request"). It's typically wrapped in a flex container at the right of the hero.

Find a block resembling:

```typescript
          <div style={{ display: 'flex', gap: 8 }}>
            <GhostBtn ...>Docs</GhostBtn>
            <PrimaryBtn ...>New request</PrimaryBtn>
          </div>
```

Delete the entire `<div>` and its children. That's it for the CTAs.

- [ ] **Step 10.3: Update the LEARN divider**

Find the JSX block with `LEARN · 3 MIN`. The label span uses `fontFamily: "'JetBrains Mono', monospace"`. Replace with:

```typescript
          <div style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: 11,
            fontWeight: 600,
            color: TOKENS.fg3,
            letterSpacing: '0.08em',
            textTransform: 'uppercase' as const,
          }}>LEARN · 3 MIN</div>
```

- [ ] **Step 10.4: Remove now-unused imports**

```bash
grep -nE '\b(BookOpen|Plus|GhostBtn|PrimaryBtn)\b' src/components/welcome/WelcomePage.tsx
```

If `Plus` / `BookOpen` only appear in import lines, remove them. `GhostBtn`/`PrimaryBtn` may still be referenced inside bento tiles — keep those if so.

- [ ] **Step 10.5: Type-check**

```bash
npx tsc --noEmit
```

- [ ] **Step 10.6: Manual smoke**

```bash
npm run dev
# Clear localStorage. Verify:
#  - Hero headline is smaller (~26px, weight 600)
#  - Logo tile smaller (40px)
#  - Tagline smaller (~13px)
#  - No buttons in the top right corner
#  - "LEARN · 3 MIN" divider uses sans-serif uppercase (not mono)
```

- [ ] **Step 10.7: Commit**

```bash
git add src/components/welcome/WelcomePage.tsx
git commit -m "feat(welcome): tone down hero + drop redundant top-right CTAs"
```

---

## Task 11: `PinnedColumn` component

**Files:**
- Create: `src/components/welcome/PinnedColumn.tsx`
- Test: `src/components/welcome/PinnedColumn.test.tsx`

A flat list of pinned paths. Each row: method badge (or folder icon) + name + folder hint. Click → opens the tab. Stale paths (not in `collection-store.files`/`docs-store.docs`/folder prefixes) render in muted fg3 with `(missing)` suffix.

- [ ] **Step 11.1: Write the failing test file**

```typescript
// src/components/welcome/PinnedColumn.test.tsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PinnedColumn } from './PinnedColumn';
import { useCollectionStore } from '@/stores/collection-store';
import { useDocsStore } from '@/stores/docs-store';
import { useEditorStore } from '@/stores/editor-store';
import { usePinnedStore } from '@/stores/pinned-store';

beforeEach(() => {
  localStorage.clear();
  useCollectionStore.setState({
    files: [
      { path: 'auth/login.ivk', name: 'login', content: 'POST https://x' },
      { path: 'users/list.ivk', name: 'list', content: 'GET https://y' },
    ],
    inlineFiles: {},
    activeFilePath: null,
    collectionPath: '/test',
  });
  useDocsStore.setState({ docs: [] });
  useEditorStore.setState({ tabs: [], activeTabPath: null });
  usePinnedStore.setState({ pinnedPaths: [], collectionPath: '/test' });
});

describe('PinnedColumn', () => {
  it('renders empty-state hint when no pins', () => {
    render(<PinnedColumn />);
    expect(screen.getByText(/right-click → Pin/i)).toBeInTheDocument();
  });

  it('renders one row per pinned path', () => {
    usePinnedStore.setState({
      pinnedPaths: ['auth/login.ivk', 'users/list.ivk'],
    });
    render(<PinnedColumn />);
    expect(screen.getByText('login')).toBeInTheDocument();
    expect(screen.getByText('list')).toBeInTheDocument();
  });

  it('clicking a pinned row opens it as a tab', async () => {
    usePinnedStore.setState({ pinnedPaths: ['auth/login.ivk'] });
    render(<PinnedColumn />);
    await userEvent.click(screen.getByText('login'));
    expect(useEditorStore.getState().tabs).toEqual([
      expect.objectContaining({ kind: 'ivk', path: 'auth/login.ivk', name: 'login' }),
    ]);
  });

  it('marks stale paths visually with (missing) suffix', () => {
    usePinnedStore.setState({ pinnedPaths: ['gone/never.ivk'] });
    render(<PinnedColumn />);
    expect(screen.getByText(/missing/i)).toBeInTheDocument();
  });

  it('header shows the pin count', () => {
    usePinnedStore.setState({
      pinnedPaths: ['auth/login.ivk', 'users/list.ivk'],
    });
    render(<PinnedColumn />);
    expect(screen.getByText('Pinned')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });
});
```

- [ ] **Step 11.2: Run — expect failure**

```bash
npx vitest run src/components/welcome/PinnedColumn.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 11.3: Implement `PinnedColumn.tsx`**

```tsx
// src/components/welcome/PinnedColumn.tsx
import { useMemo } from 'react';
import { Folder } from 'lucide-react';
import { parseIvk, type HttpMethod } from 'ivkjs';
import { useCollectionStore } from '@/stores/collection-store';
import { useDocsStore } from '@/stores/docs-store';
import { useEditorStore, type TabData } from '@/stores/editor-store';
import { usePinnedStore } from '@/stores/pinned-store';
import { TOKENS, MethodBadge } from '@/components/shared/primitives';

/**
 * Two-column dashboard's left side. Lists user-pinned paths (set via
 * UnifiedTree right-click → Pin). Stale paths (no longer in the loaded
 * collection) render muted with a `(missing)` suffix so the user can
 * see they exist but are unreachable until restored.
 */
export function PinnedColumn() {
  const pinnedPaths = usePinnedStore((s) => s.pinnedPaths);
  const files = useCollectionStore((s) => s.files);
  const docs = useDocsStore((s) => s.docs);
  const openTab = useEditorStore((s) => s.openTab);

  const folderPaths = useMemo(() => {
    const set = new Set<string>();
    for (const f of files) {
      const parts = f.path.split('/');
      for (let i = 1; i < parts.length; i++) {
        set.add(parts.slice(0, i).join('/'));
      }
    }
    return set;
  }, [files]);

  const knownFile = useMemo(() => {
    const m = new Map<string, { kind: 'ivk' | 'doc' | 'folder'; method?: string; folder?: string; name: string }>();
    for (const f of files) {
      const parts = f.path.split('/');
      const name = (parts.pop() ?? '').replace(/\.ivk$/, '');
      let method: string | undefined;
      try {
        method = parseIvk(f.content)?.method ?? undefined;
      } catch {
        method = undefined;
      }
      m.set(f.path, { kind: 'ivk', method, folder: parts.join('/'), name });
    }
    for (const d of docs) {
      const parts = d.path.split('/');
      const name = (parts.pop() ?? '').replace(/\.md$/, '');
      m.set(d.path, { kind: 'doc', folder: parts.join('/'), name });
    }
    for (const folder of folderPaths) {
      const parts = folder.split('/');
      const name = parts.pop() ?? folder;
      m.set(folder, { kind: 'folder', folder: parts.join('/'), name });
    }
    return m;
  }, [files, docs, folderPaths]);

  const handleClick = (path: string) => {
    const meta = knownFile.get(path);
    if (!meta) return; // stale — no-op (could surface a toast later)
    const tab: TabData = {
      kind: meta.kind,
      path,
      name: meta.name,
      method: meta.kind === 'ivk' ? meta.method : undefined,
      hasReadme: meta.kind === 'folder' || undefined,
    };
    openTab(tab);
  };

  return (
    <div>
      <SectionHeader label="Pinned" count={pinnedPaths.length} />
      {pinnedPaths.length === 0 ? (
        <div style={{ fontSize: 12, color: TOKENS.fg3, padding: '4px 8px' }}>
          Pin a request from the sidebar (right-click → Pin).
        </div>
      ) : (
        pinnedPaths.map((path) => {
          const meta = knownFile.get(path);
          const stale = !meta;
          return (
            <button
              key={path}
              onClick={() => handleClick(path)}
              disabled={stale}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                padding: '6px 8px',
                background: 'transparent',
                border: 'none',
                borderRadius: 5,
                cursor: stale ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                fontSize: 12,
                color: stale ? TOKENS.fg3 : TOKENS.fg1,
                textAlign: 'left' as const,
                opacity: stale ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (!stale) e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              {meta?.kind === 'folder' && <Folder size={11} style={{ color: TOKENS.fg3 }} />}
              {meta?.kind === 'ivk' && meta.method && (
                <MethodBadge method={meta.method as HttpMethod} compact />
              )}
              {meta?.kind === 'doc' && (
                <span style={{ width: 11, color: TOKENS.fg3, fontSize: 10 }}>md</span>
              )}
              <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {meta?.name ?? path.split('/').pop()}
              </span>
              {stale ? (
                <span style={{ fontSize: 10, color: TOKENS.fg3 }}>(missing)</span>
              ) : meta?.folder ? (
                <span style={{ fontSize: 10, color: TOKENS.fg3 }}>{meta.folder}/</span>
              ) : null}
            </button>
          );
        })
      )}
    </div>
  );
}

function SectionHeader({ label, count }: { label: string; count: number }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 6,
        padding: '6px 8px 4px',
        fontFamily: "'Inter', system-ui, sans-serif",
        fontSize: 11,
        fontWeight: 600,
        color: TOKENS.fg2,
        letterSpacing: '0.08em',
        textTransform: 'uppercase' as const,
      }}
    >
      <span>{label}</span>
      <span style={{ color: TOKENS.fg3 }}>{count}</span>
    </div>
  );
}
```

- [ ] **Step 11.4: Run — expect 5 tests pass**

```bash
npx vitest run src/components/welcome/PinnedColumn.test.tsx
```

Expected: PASS — 5 tests.

- [ ] **Step 11.5: Commit**

```bash
git add src/components/welcome/PinnedColumn.tsx src/components/welcome/PinnedColumn.test.tsx
git commit -m "feat(welcome): add PinnedColumn for the new dashboard"
```

---

## Task 12: `RecentColumn` component

**Files:**
- Create: `src/components/welcome/RecentColumn.tsx`
- Test: `src/components/welcome/RecentColumn.test.tsx`

Same shape as `PinnedColumn` but uses `recent-store` and shows a relative-time suffix (`5m`, `2h`, `3d`) instead of the folder.

- [ ] **Step 12.1: Write the failing test file**

```typescript
// src/components/welcome/RecentColumn.test.tsx
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecentColumn } from './RecentColumn';
import { useCollectionStore } from '@/stores/collection-store';
import { useDocsStore } from '@/stores/docs-store';
import { useEditorStore } from '@/stores/editor-store';
import { useRecentStore } from '@/stores/recent-store';

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-05-07T10:00:00Z'));
  useCollectionStore.setState({
    files: [
      { path: 'auth/login.ivk', name: 'login', content: 'POST https://x' },
    ],
    inlineFiles: {},
    activeFilePath: null,
    collectionPath: '/test',
  });
  useDocsStore.setState({ docs: [] });
  useEditorStore.setState({ tabs: [], activeTabPath: null });
  useRecentStore.setState({ recent: [], collectionPath: '/test' });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('RecentColumn', () => {
  it('renders empty-state hint when no recent', () => {
    render(<RecentColumn />);
    expect(screen.getByText(/start building history/i)).toBeInTheDocument();
  });

  it('renders one row per recent entry, head first', () => {
    useRecentStore.setState({
      recent: [
        { path: 'auth/login.ivk', openedAt: Date.now() - 60_000 },
      ],
      collectionPath: '/test',
    });
    render(<RecentColumn />);
    expect(screen.getByText('login')).toBeInTheDocument();
  });

  it('clicking a recent row opens it as a tab', async () => {
    useRecentStore.setState({
      recent: [{ path: 'auth/login.ivk', openedAt: Date.now() }],
      collectionPath: '/test',
    });
    render(<RecentColumn />);
    await userEvent.click(screen.getByText('login'));
    expect(useEditorStore.getState().tabs).toEqual([
      expect.objectContaining({ path: 'auth/login.ivk' }),
    ]);
  });

  it('relative-time formatter: <60s → "now"', () => {
    useRecentStore.setState({
      recent: [{ path: 'auth/login.ivk', openedAt: Date.now() - 30_000 }],
      collectionPath: '/test',
    });
    render(<RecentColumn />);
    expect(screen.getByText('now')).toBeInTheDocument();
  });

  it('relative-time formatter: minutes → "5m"', () => {
    useRecentStore.setState({
      recent: [{ path: 'auth/login.ivk', openedAt: Date.now() - 5 * 60_000 }],
      collectionPath: '/test',
    });
    render(<RecentColumn />);
    expect(screen.getByText('5m')).toBeInTheDocument();
  });

  it('relative-time formatter: hours → "2h"', () => {
    useRecentStore.setState({
      recent: [{ path: 'auth/login.ivk', openedAt: Date.now() - 2 * 3600_000 }],
      collectionPath: '/test',
    });
    render(<RecentColumn />);
    expect(screen.getByText('2h')).toBeInTheDocument();
  });

  it('relative-time formatter: days → "3d"', () => {
    useRecentStore.setState({
      recent: [{ path: 'auth/login.ivk', openedAt: Date.now() - 3 * 86400_000 }],
      collectionPath: '/test',
    });
    render(<RecentColumn />);
    expect(screen.getByText('3d')).toBeInTheDocument();
  });

  it('marks stale paths visually with (missing) suffix', () => {
    useRecentStore.setState({
      recent: [{ path: 'gone/never.ivk', openedAt: Date.now() }],
      collectionPath: '/test',
    });
    render(<RecentColumn />);
    expect(screen.getByText(/missing/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 12.2: Run — expect failure**

```bash
npx vitest run src/components/welcome/RecentColumn.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 12.3: Implement `RecentColumn.tsx`**

```tsx
// src/components/welcome/RecentColumn.tsx
import { useMemo } from 'react';
import { Folder } from 'lucide-react';
import { parseIvk, type HttpMethod } from 'ivkjs';
import { useCollectionStore } from '@/stores/collection-store';
import { useDocsStore } from '@/stores/docs-store';
import { useEditorStore, type TabData } from '@/stores/editor-store';
import { useRecentStore } from '@/stores/recent-store';
import { TOKENS, MethodBadge } from '@/components/shared/primitives';

/**
 * Two-column dashboard's right side. Lists recently opened paths (LRU,
 * cap 15, head-first). Same stale-path treatment as PinnedColumn.
 */
export function RecentColumn() {
  const recent = useRecentStore((s) => s.recent);
  const files = useCollectionStore((s) => s.files);
  const docs = useDocsStore((s) => s.docs);
  const openTab = useEditorStore((s) => s.openTab);

  const folderPaths = useMemo(() => {
    const set = new Set<string>();
    for (const f of files) {
      const parts = f.path.split('/');
      for (let i = 1; i < parts.length; i++) {
        set.add(parts.slice(0, i).join('/'));
      }
    }
    return set;
  }, [files]);

  const knownFile = useMemo(() => {
    const m = new Map<string, { kind: 'ivk' | 'doc' | 'folder'; method?: string; name: string }>();
    for (const f of files) {
      const name = (f.path.split('/').pop() ?? '').replace(/\.ivk$/, '');
      let method: string | undefined;
      try {
        method = parseIvk(f.content)?.method ?? undefined;
      } catch {
        method = undefined;
      }
      m.set(f.path, { kind: 'ivk', method, name });
    }
    for (const d of docs) {
      const name = (d.path.split('/').pop() ?? '').replace(/\.md$/, '');
      m.set(d.path, { kind: 'doc', name });
    }
    for (const folder of folderPaths) {
      const name = folder.split('/').pop() ?? folder;
      m.set(folder, { kind: 'folder', name });
    }
    return m;
  }, [files, docs, folderPaths]);

  const handleClick = (path: string) => {
    const meta = knownFile.get(path);
    if (!meta) return;
    const tab: TabData = {
      kind: meta.kind,
      path,
      name: meta.name,
      method: meta.kind === 'ivk' ? meta.method : undefined,
      hasReadme: meta.kind === 'folder' || undefined,
    };
    openTab(tab);
  };

  return (
    <div>
      <SectionHeader label="Recent" count={recent.length} />
      {recent.length === 0 ? (
        <div style={{ fontSize: 12, color: TOKENS.fg3, padding: '4px 8px' }}>
          Open a request to start building history.
        </div>
      ) : (
        recent.map((entry) => {
          const meta = knownFile.get(entry.path);
          const stale = !meta;
          return (
            <button
              key={entry.path}
              onClick={() => handleClick(entry.path)}
              disabled={stale}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                padding: '6px 8px',
                background: 'transparent',
                border: 'none',
                borderRadius: 5,
                cursor: stale ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                fontSize: 12,
                color: stale ? TOKENS.fg3 : TOKENS.fg1,
                textAlign: 'left' as const,
                opacity: stale ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (!stale) e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              {meta?.kind === 'folder' && <Folder size={11} style={{ color: TOKENS.fg3 }} />}
              {meta?.kind === 'ivk' && meta.method && (
                <MethodBadge method={meta.method as HttpMethod} compact />
              )}
              {meta?.kind === 'doc' && (
                <span style={{ width: 11, color: TOKENS.fg3, fontSize: 10 }}>md</span>
              )}
              <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {meta?.name ?? entry.path.split('/').pop()}
              </span>
              <span style={{ fontSize: 10, color: TOKENS.fg3 }}>
                {stale ? '(missing)' : formatRelative(Date.now() - entry.openedAt)}
              </span>
            </button>
          );
        })
      )}
    </div>
  );
}

function formatRelative(deltaMs: number): string {
  if (deltaMs < 60_000) return 'now';
  const minutes = Math.floor(deltaMs / 60_000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function SectionHeader({ label, count }: { label: string; count: number }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 6,
        padding: '6px 8px 4px',
        fontFamily: "'Inter', system-ui, sans-serif",
        fontSize: 11,
        fontWeight: 600,
        color: TOKENS.fg2,
        letterSpacing: '0.08em',
        textTransform: 'uppercase' as const,
      }}
    >
      <span>{label}</span>
      <span style={{ color: TOKENS.fg3 }}>{count}</span>
    </div>
  );
}
```

- [ ] **Step 12.4: Run — expect 8 tests pass**

```bash
npx vitest run src/components/welcome/RecentColumn.test.tsx
```

Expected: PASS — 8 tests.

- [ ] **Step 12.5: Commit**

```bash
git add src/components/welcome/RecentColumn.tsx src/components/welcome/RecentColumn.test.tsx
git commit -m "feat(welcome): add RecentColumn (LRU list + relative time)"
```

---

## Task 13: Rewrite `CollectionDashboard`

**Files:**
- Modify: `src/components/welcome/CollectionDashboard.tsx` (full rewrite)

Compact hero (logo 22px + name + meta on one row, ~32px tall) + two-column grid of `<PinnedColumn />` and `<RecentColumn />`. Stacks under 700px viewport width.

- [ ] **Step 13.1: Write the new file (full replacement)**

```tsx
// src/components/welcome/CollectionDashboard.tsx
import { useMemo } from 'react';
import { useCollectionStore } from '@/stores/collection-store';
import { useDocsStore } from '@/stores/docs-store';
import { TOKENS, InvokerMark } from '@/components/shared/primitives';
import { PinnedColumn } from './PinnedColumn';
import { RecentColumn } from './RecentColumn';

/**
 * Functional jumping board shown when a collection is loaded but no
 * tab is active. Replaces the bento dashboard from earlier iterations
 * (per the 2026-05-07 redesign spec).
 */
export function CollectionDashboard() {
  const files = useCollectionStore((s) => s.files);
  const docs = useDocsStore((s) => s.docs);
  const basePath = useCollectionStore((s) => s.collectionPath) ?? '';

  const meta = useMemo(() => {
    const folders = new Set<string>();
    for (const f of files) {
      const parts = f.path.split('/');
      if (parts.length > 1) folders.add(parts.slice(0, -1).join('/'));
    }
    return {
      reqs: files.length,
      docs: docs.length,
      folders: folders.size,
    };
  }, [files, docs]);

  const collectionName =
    basePath === '(sample)' ? 'Sample collection' : basePath.split('/').pop() || basePath || 'Your collection';

  return (
    <div
      style={{
        height: '100%',
        overflow: 'auto',
        background: TOKENS.s1,
        color: TOKENS.fg1,
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <div style={{ maxWidth: 1040, margin: '0 auto', padding: '32px 32px 48px' }}>
        {/* Compact hero — single row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 28,
            color: TOKENS.fg2,
            fontSize: 12,
          }}
        >
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              background: 'rgba(230,193,136,0.08)',
              boxShadow: `inset 0 0 0 1px ${TOKENS.strokeHot}`,
            }}
          >
            <InvokerMark size={12} />
          </div>
          <span style={{ color: TOKENS.fg1, fontSize: 14, fontWeight: 600 }}>
            {collectionName}
          </span>
          <span>·</span>
          <span>{meta.reqs} reqs</span>
          <span>·</span>
          <span>{meta.docs} docs</span>
          <span>·</span>
          <span>{meta.folders} folders</span>
        </div>

        {/* Two-column working surface */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 24,
          }}
        >
          <PinnedColumn />
          <RecentColumn />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 13.2: Type-check**

```bash
npx tsc --noEmit
```

- [ ] **Step 13.3: Run all tests**

```bash
npm test
```

Expected: PASS.

- [ ] **Step 13.4: Manual smoke**

```bash
npm run dev
# Load sample collection. Close any open tabs (⌘W).
# Verify:
#  - Compact hero with collection name + counts
#  - Two columns: Pinned (empty hint) | Recent (empty hint)
#  - Right-click a request in the sidebar → Pin → row appears in Pinned
#  - Click a request to open + close it → row appears in Recent
#  - Reload page → both columns persist
```

- [ ] **Step 13.5: Commit**

```bash
git add src/components/welcome/CollectionDashboard.tsx
git commit -m "feat(welcome): rewrite CollectionDashboard as Pinned + Recent"
```

---

## Task 14: E2E — `dashboard-pinned-recent.spec.ts`

**Files:**
- Create: `e2e/dashboard-pinned-recent.spec.ts`

End-to-end coverage of the dashboard flow: load sample, pin a request, see it in Pinned column; close all tabs, see it in Recent column; reload, verify persistence.

- [ ] **Step 14.1: Write the e2e spec**

```typescript
// e2e/dashboard-pinned-recent.spec.ts
import { test, expect } from '@playwright/test';

/**
 * End-to-end coverage of the redesigned CollectionDashboard.
 * Sample collection ships with a `playground` folder containing
 * a few `.ivk` files used as fixtures here.
 */
test('Recent column tracks opened tabs, persists across reload', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
  });
  await page.goto('/');
  await page.getByRole('button', { name: /try sample/i }).first().click();
  await expect(page.getByText(/Sample collection/i).first()).toBeVisible();

  // Open the playground folder.
  await page.getByText(/^playground$/).first().click();

  // Open the first .ivk request.
  const firstRequest = page.locator('button:has-text("01-hello-world")').first();
  await firstRequest.click();

  // Close it (⌘W on macOS, Ctrl+W elsewhere).
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+w' : 'Control+w');

  // Dashboard should now show the request in Recent.
  await expect(page.getByText('Recent')).toBeVisible();
  await expect(
    page.locator('button:has-text("01-hello-world")'),
  ).toHaveCount({ greaterThan: 0 } as any);

  // Reload — recent should persist (sample collection key).
  await page.reload();
  await expect(page.getByText('Recent')).toBeVisible();
  await expect(
    page.locator('button:has-text("01-hello-world")'),
  ).toBeVisible();
});

test('Right-click → Pin adds an entry to the Pinned column', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
  });
  await page.goto('/');
  await page.getByRole('button', { name: /try sample/i }).first().click();
  await expect(page.getByText(/Sample collection/i).first()).toBeVisible();

  // Open the playground folder and right-click a file.
  await page.getByText(/^playground$/).first().click();
  await page
    .locator('button:has-text("01-hello-world")')
    .first()
    .click({ button: 'right' });

  await page.getByRole('menuitem', { name: /^Pin$/ }).click();

  // Open dashboard by closing all tabs.
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+w' : 'Control+w');

  await expect(page.getByText('Pinned')).toBeVisible();
  await expect(
    page.locator('button:has-text("01-hello-world")').first(),
  ).toBeVisible();
});
```

- [ ] **Step 14.2: Run e2e**

```bash
npx playwright test e2e/dashboard-pinned-recent.spec.ts --reporter=list
```

Expected: PASS — 2 tests.

(If a selector doesn't match because the sample collection's filenames differ, adjust the test fixture names. Run `cat src/data/sample-collection.ts | grep -E "name:" | head` to discover real names.)

- [ ] **Step 14.3: Commit**

```bash
git add e2e/dashboard-pinned-recent.spec.ts
git commit -m "test(e2e): cover Pinned + Recent dashboard flow"
```

---

## Task 15: Run the full suite + manual three-mode verification

**Files:** none modified.

Per CLAUDE.md, UI-touching changes need to be exercised in **all three modes** before merge.

- [ ] **Step 15.1: Full test suite**

```bash
cd /Users/dostonkamilov/Projects/invoker/invoker-app
npm test
```

Expected: PASS — all tests (existing + ~30 new).

- [ ] **Step 15.2: Typecheck**

```bash
npx tsc --noEmit
```

Expected: clean.

- [ ] **Step 15.3: Build**

```bash
npm run build
```

Expected: clean Vite build to `dist/`.

- [ ] **Step 15.4: Browser-mode manual pass**

```bash
npm run dev
```

Open http://localhost:5173. Confirm:
- Empty state sidebar: header + "Open a folder from the welcome screen." line + footer.
- Welcome page: smaller hero, no top-right CTAs, Inter caps on tile labels.
- Click "Try sample" → sidebar shows tree, dashboard shows compact hero + Pinned (empty) + Recent (empty).
- Right-click a tree row → Pin item appears, click it → row appears in Pinned column.
- Click a request → opens; close → request shows in Recent.
- Reload page → both Pinned + Recent persist.
- Kebab on collection header: Refresh / Collapse all / Change folder all clickable.
- "+ New…" row opens popup with three create options.

Kill dev server.

- [ ] **Step 15.5: Tauri-mode manual pass**

```bash
npm run tauri:dev
```

Repeat the browser checklist inside the Tauri window. Additionally:
- Kebab → Refresh from disk works (modify a file outside the app, click Refresh, see the change).
- "+ New…" → New request → file actually appears on disk.

Quit Tauri app.

- [ ] **Step 15.6: Published-mode manual pass**

```bash
npm run invoker:build -- design-system/project/redesign
npm run preview
```

Open the preview URL. Confirm:
- Dashboard renders with the baked collection's pinned/recent state (which would be empty fresh).
- Right-click → no Pin item (or item disabled — depends on whether published is read-only); recent still tracks opens.

(Stop preview server.)

- [ ] **Step 15.7: Commit a chore note if any small fixes landed during smoke**

If you found any small fixes during smoke (e.g. a misaligned pixel), make those edits and commit:

```bash
git add -p
git commit -m "fix(welcome): minor smoke-pass adjustments"
```

If no fixes, skip this step.

---

## Task 16: Open the PR

**Files:** none.

- [ ] **Step 16.1: Push the branch**

```bash
git push -u origin feat/sidebar-dashboard-redesign
```

- [ ] **Step 16.2: Open PR against `stage`**

```bash
gh pr create --base stage --title "feat: sidebar + dashboard redesign" --body "$(cat <<'EOF'
## Summary

Implements the spec in `docs/superpowers/specs/2026-05-07-sidebar-and-dashboard-redesign-design.md`.

- **Sidebar** — drops the icon toolbar from PR #88, adds a labeled "+ New…" row, moves Refresh + Collapse all + Change folder into a kebab on the collection header, flattens the search row, and minimal empty-state branch.
- **CollectionDashboard** — full rewrite. Compact hero + two-column **Pinned + Recent**. Replaces the bento.
- **WelcomePage** — tone down hero (40px logo, 26px headline), drop redundant top-right CTAs, Inter small-caps on tile labels.
- **New stores** — `pinned-store` and `recent-store`, both keyed per-collection-path in `localStorage`. Recent is LRU capped at 15.
- **Wiring** — `editor-store.openTab` now marks `recent-store` (skip inline paths). UnifiedTree right-click gains Pin/Unpin (files + folders).

## Test plan

- [x] `npm test` — all existing + ~30 new tests pass
- [x] `npx tsc --noEmit` clean
- [x] `npm run build` clean
- [x] Browser mode: sample collection, pin/unpin, recent tracking, persistence, kebab actions
- [x] Tauri mode: same checklist + disk refresh + on-disk file create
- [x] Published mode: dashboard renders, recent tracking still works
- [x] Playwright: `e2e/sidebar-create-menu.spec.ts` (4 tests, 1 new) and `e2e/dashboard-pinned-recent.spec.ts` (2 tests new)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 16.3: Wait for CI checks**

```bash
gh pr checks --watch
```

Expected: build, e2e, tauri-smoke, GitGuardian all pass.

- [ ] **Step 16.4: Report ready for review**

Print the PR URL and stop. Don't merge — that's a human decision.

---

## Self-Review

After writing this plan, I checked it against the spec:

- ✅ Spec goal 1 (restore design-system fidelity for sidebar) → Tasks 6+7
- ✅ Spec goal 2 (reduce chrome density) → Tasks 6+7 (search flatten + remove SidebarToolbar)
- ✅ Spec goal 3 (functional dashboard) → Tasks 11+12+13
- ✅ Spec goal 4 (welcome page redundancy + hero) → Task 10
- ✅ Spec goal 5 (single typography accent) → Tasks 9+10
- ✅ Spec goal 6 (pinned + recent stores, per-collection localStorage) → Tasks 1+2+4
- ✅ Component boundaries section (Sidebar / CollectionDashboard / WelcomePage / PinnedColumn / RecentColumn / pinned-store / recent-store / TileHeader) → all touched
- ✅ Data flow steps 1–4 → covered by Tasks 1+2+4 (subscription) + Task 3 (openTab wiring) + Task 5 (right-click wiring)
- ✅ Error handling — corruption defense in store tests; stale-path rendering in PinnedColumn / RecentColumn
- ✅ Testing matrix — all rows in spec have a corresponding test task
- ✅ E2E updates — Task 6.5 (adapt selectors) + Task 14 (new pinned/recent spec)
- ✅ Migration / rollout — Task 16 (single PR, single feature-flag-free release)

No placeholders found. Method names and types are consistent across tasks (`pin`/`unpin`/`togglePin`/`isPinned`/`setCollectionPath` for pinned; `markOpened`/`setCollectionPath` for recent; `RecentEntry` shape consistent everywhere).
