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
});
