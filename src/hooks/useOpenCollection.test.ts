import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

/**
 * Regression: `useOpenCollection.openCollection()` did NOT write to
 * `localStorage.invoker:last-collection-path` when opening a real
 * folder (Tauri or browser File System Access). It only wrote it
 * inside `loadSample()`. Result: the General → "Open last collection
 * on launch" toggle (PR #41) silently failed for any user who opened
 * a real folder — they'd never auto-load on next session.
 *
 * The fix writes the path right after the store is updated in both
 * the Tauri and browser branches.
 */

const openCollectionDialog = vi.fn();
const openCollectionFromBrowser = vi.fn();
const loadCollectionFn = vi.fn();
const hasBrowserFolderApi = vi.fn(() => false);

vi.mock('@/lib/file-system', () => ({
  openCollectionDialog: () => openCollectionDialog(),
  loadCollection: (path: string) => loadCollectionFn(path),
  openCollectionFromBrowser: () => openCollectionFromBrowser(),
  hasBrowserFolderApi: () => hasBrowserFolderApi(),
}));

const isTauriMock = vi.fn(() => false);
vi.mock('@/lib/platform', () => ({
  isTauri: () => isTauriMock(),
  isPublished: () => false,
}));

import { useOpenCollection } from './useOpenCollection';

describe('useOpenCollection — last-collection-path persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    openCollectionDialog.mockReset();
    openCollectionFromBrowser.mockReset();
    loadCollectionFn.mockReset();
    hasBrowserFolderApi.mockReset();
    isTauriMock.mockReset();
    hasBrowserFolderApi.mockReturnValue(false);
    isTauriMock.mockReturnValue(false);
  });
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('writes last-collection-path when openCollection succeeds via Tauri', async () => {
    isTauriMock.mockReturnValue(true);
    openCollectionDialog.mockResolvedValue('/Users/me/work/api');
    loadCollectionFn.mockResolvedValue({
      ivkFiles: [{ path: 'foo.ivk', name: 'foo', content: 'GET https://x' }],
      mdFiles: [],
      basePath: '/Users/me/work/api',
    });

    const { result } = renderHook(() => useOpenCollection());
    await act(async () => {
      await result.current.openCollection();
    });

    expect(localStorage.getItem('invoker:last-collection-path')).toBe(
      '/Users/me/work/api',
    );
  });

  it('writes last-collection-path when openCollection succeeds via browser FSA', async () => {
    hasBrowserFolderApi.mockReturnValue(true);
    openCollectionFromBrowser.mockResolvedValue({
      ivkFiles: [{ path: 'foo.ivk', name: 'foo', content: 'GET https://x' }],
      mdFiles: [],
      basePath: 'work',
    });

    const { result } = renderHook(() => useOpenCollection());
    await act(async () => {
      await result.current.openCollection();
    });

    expect(localStorage.getItem('invoker:last-collection-path')).toBe('work');
  });

  it('does NOT write last-collection-path when the user cancels the picker (Tauri)', async () => {
    isTauriMock.mockReturnValue(true);
    openCollectionDialog.mockResolvedValue(undefined);
    const { result } = renderHook(() => useOpenCollection());
    await act(async () => {
      await result.current.openCollection();
    });
    expect(localStorage.getItem('invoker:last-collection-path')).toBeNull();
  });

  it('does NOT write last-collection-path when browser picker returns null', async () => {
    hasBrowserFolderApi.mockReturnValue(true);
    openCollectionFromBrowser.mockResolvedValue(null);
    const { result } = renderHook(() => useOpenCollection());
    await act(async () => {
      await result.current.openCollection();
    });
    expect(localStorage.getItem('invoker:last-collection-path')).toBeNull();
  });

  it('does NOT write last-collection-path when browser picker returns empty folder', async () => {
    hasBrowserFolderApi.mockReturnValue(true);
    openCollectionFromBrowser.mockResolvedValue({
      ivkFiles: [],
      mdFiles: [],
      basePath: 'empty',
    });
    // Stub window.alert so the empty-folder warning doesn't blow up jsdom.
    window.alert = vi.fn();
    const { result } = renderHook(() => useOpenCollection());
    await act(async () => {
      await result.current.openCollection();
    });
    expect(localStorage.getItem('invoker:last-collection-path')).toBeNull();
  });

  it('loadSample still writes (sample) — no regression', () => {
    const { result } = renderHook(() => useOpenCollection());
    act(() => {
      result.current.loadSample();
    });
    expect(localStorage.getItem('invoker:last-collection-path')).toBe('(sample)');
  });
});
