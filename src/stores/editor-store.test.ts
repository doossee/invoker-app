import { beforeEach, describe, expect, it } from 'vitest';
import { useEditorStore, type TabData } from './editor-store';

/**
 * Pins the tab-lifecycle contract that the dogfooding session called
 * out: dirty marker (•) must NOT carry over from a previous tab record
 * after close+reopen. Each fresh openTab call should start the tab in a
 * clean state, regardless of how the previous instance ended.
 *
 * Why this matters: the editor-store treats each tab record as the
 * source of truth for the "•" badge and the SAVE-button highlight.
 * Stale dirty=true after reopen lies to the user about disk state and
 * can lead them to "save" an unchanged file, or panic about edits they
 * never made.
 */
describe('editor-store tab lifecycle', () => {
  beforeEach(() => {
    // Reset the store between tests — zustand persists global state.
    useEditorStore.setState({ tabs: [], activeTabPath: null });
  });

  function open(path: string, extra: Partial<TabData> = {}) {
    useEditorStore.getState().openTab({ kind: 'ivk', path, name: path, ...extra });
  }

  it('openTab adds a new tab with no implicit dirty flag', () => {
    open('a.ivk');
    const tab = useEditorStore.getState().tabs[0];
    expect(tab.dirty).toBeFalsy();
  });

  it('reopening a previously-closed dirty tab resets dirty to false', () => {
    open('a.ivk');
    useEditorStore.getState().markDirty('a.ivk', true);
    expect(useEditorStore.getState().tabs[0].dirty).toBe(true);

    useEditorStore.getState().closeTab('a.ivk');
    expect(useEditorStore.getState().tabs).toHaveLength(0);

    open('a.ivk');
    const reopened = useEditorStore.getState().tabs[0];
    expect(reopened.dirty).toBeFalsy();
  });

  it('reopening an already-open tab does NOT clobber its dirty state', () => {
    // The other half of the contract — if the tab is currently mounted
    // and the user clicks it in the sidebar (which calls openTab again),
    // the existing dirty flag must survive. Otherwise the user loses
    // the visual signal mid-edit.
    open('b.ivk');
    useEditorStore.getState().markDirty('b.ivk', true);
    open('b.ivk'); // sidebar re-click
    const tab = useEditorStore.getState().tabs[0];
    expect(tab.dirty).toBe(true);
  });

  it('closeTab evicts the cached response so reopen starts clean', () => {
    // Regression: closeTab used to filter the tabs array but leave the
    // entry in responseCache. Reopening the tab read the stale cached
    // response — confusing for the user (they expect a fresh send) and
    // a memory leak across many open/close cycles.
    open('c.ivk');
    useEditorStore.getState().cacheResponse('c.ivk', {
      response: { status: 200, headers: {}, body: 'old', time: 50, size: 3 },
      testResults: [],
      logs: [],
    });
    expect(useEditorStore.getState().getResponse('c.ivk')).toBeDefined();

    useEditorStore.getState().closeTab('c.ivk');
    expect(useEditorStore.getState().getResponse('c.ivk')).toBeUndefined();
  });

  it('closeTab leaves OTHER tabs\' cached responses intact', () => {
    open('d.ivk');
    open('e.ivk');
    const result = {
      response: { status: 200, headers: {}, body: 'kept', time: 50, size: 4 },
      testResults: [],
      logs: [],
    };
    useEditorStore.getState().cacheResponse('e.ivk', result);
    useEditorStore.getState().closeTab('d.ivk');
    expect(useEditorStore.getState().getResponse('e.ivk')?.response.body).toBe('kept');
  });
});

describe('editor-store purgeStaleTabs', () => {
  beforeEach(() => {
    useEditorStore.setState({ tabs: [], activeTabPath: null, responseCache: {} });
  });

  function open(path: string, extra: Partial<TabData> = {}) {
    useEditorStore.getState().openTab({ kind: 'ivk', path, name: path, ...extra });
  }

  it('drops tabs whose paths are NOT in the valid set', () => {
    open('keep.ivk');
    open('drop.ivk');
    useEditorStore.getState().purgeStaleTabs(new Set(['keep.ivk']));
    const paths = useEditorStore.getState().tabs.map((t) => t.path);
    expect(paths).toEqual(['keep.ivk']);
  });

  it('preserves inline/ tabs even if not in the valid set', () => {
    open('inline/Untitled-abc.ivk');
    open('drop.ivk');
    useEditorStore.getState().purgeStaleTabs(new Set([]));
    const paths = useEditorStore.getState().tabs.map((t) => t.path);
    expect(paths).toEqual(['inline/Untitled-abc.ivk']);
  });

  it('falls back the active tab when the active tab gets dropped', () => {
    open('a.ivk');
    open('drop.ivk');
    useEditorStore.getState().setActiveTab('drop.ivk');
    useEditorStore.getState().purgeStaleTabs(new Set(['a.ivk']));
    expect(useEditorStore.getState().activeTabPath).toBe('a.ivk');
  });

  it('sets activeTabPath to null when every tab is dropped', () => {
    open('a.ivk');
    useEditorStore.getState().setActiveTab('a.ivk');
    useEditorStore.getState().purgeStaleTabs(new Set([]));
    expect(useEditorStore.getState().tabs).toHaveLength(0);
    expect(useEditorStore.getState().activeTabPath).toBeNull();
  });

  it('evicts cached responses for dropped tabs', () => {
    open('keep.ivk');
    open('drop.ivk');
    const result = {
      response: { status: 200, headers: {}, body: 'X', time: 50, size: 1 },
      testResults: [],
      logs: [],
    };
    useEditorStore.getState().cacheResponse('keep.ivk', result);
    useEditorStore.getState().cacheResponse('drop.ivk', result);
    useEditorStore.getState().purgeStaleTabs(new Set(['keep.ivk']));
    expect(useEditorStore.getState().getResponse('keep.ivk')).toBeDefined();
    expect(useEditorStore.getState().getResponse('drop.ivk')).toBeUndefined();
  });

  it('is a no-op when every tab is in the valid set', () => {
    open('a.ivk');
    open('b.ivk');
    const tabsBefore = useEditorStore.getState().tabs;
    useEditorStore.getState().purgeStaleTabs(new Set(['a.ivk', 'b.ivk']));
    // Same array reference — no spurious re-render trigger
    expect(useEditorStore.getState().tabs).toBe(tabsBefore);
  });
});

describe('editor-store / recent-store integration', () => {
  beforeEach(async () => {
    localStorage.clear();
    useEditorStore.setState({ tabs: [], activeTabPath: null });
    // Explicit reset of recent-store so each test starts from a known
    // empty state regardless of whether setCollectionPath reloads or
    // short-circuits in the future.
    const { useRecentStore } = await import('./recent-store');
    useRecentStore.setState({ recent: [], collectionPath: null });
  });

  it('openTab marks the path as recently opened', async () => {
    const { useRecentStore } = await import('./recent-store');
    useRecentStore.getState().setCollectionPath('/test');

    useEditorStore.getState().openTab({
      kind: 'ivk',
      path: 'a/b.ivk',
      name: 'b',
    });

    // Flush the lazy `import('./recent-store')` inside openTab. A bare
    // `await Promise.resolve()` isn't enough — vitest's module loader
    // resolves dynamic imports across more than one microtask tick even
    // when the module is already cached. setTimeout(0) drains the
    // current task plus the queued microtasks reliably.
    await new Promise((r) => setTimeout(r, 0));

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

    // Same flush as above — defensive in case openTab ever queues work
    // for inline paths in the future.
    await new Promise((r) => setTimeout(r, 0));

    expect(useRecentStore.getState().recent).toEqual([]);
  });
});
