import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useCollectionStore } from './collection-store';

/**
 * Pins the Tauri disk integration for renameFile / deleteFile.
 *
 * PR #48 shipped these actions as in-memory only; the BUGS.md
 * "Sidebar tree context menu — Tauri disk integration" follow-up
 * tracked wiring them to `@tauri-apps/plugin-fs.rename` / `.remove`.
 *
 * Same scenario matrix as `collection-store-tauri-save.test.ts`:
 *   - Tauri 2 (window.isTauri) → disk call happens
 *   - Tauri 2 internals (window.__TAURI_INTERNALS__) → disk call happens
 *   - Tauri 1 legacy (window.__TAURI__) → still works
 *   - browser-mode (no flags) → no disk call, in-memory only
 *   - virtual collection ('(sample)' / '(published)') → no disk call
 *   - trailing-slash collectionPath → no double slash in built path
 *   - inline files → never touch disk
 *
 * Disk call ordering matters: rename/delete must hit disk BEFORE the
 * in-memory mutation, so a fs error aborts the action without
 * leaving the store divergent from the filesystem.
 */

const rename = vi.fn(async (_from: string, _to: string) => undefined);
const remove = vi.fn(async (_path: string) => undefined);

vi.mock('@tauri-apps/plugin-fs', () => ({
  rename: (from: string, to: string) => rename(from, to),
  remove: (path: string) => remove(path),
}));

describe('collection-store.renameFile — Tauri disk integration', () => {
  beforeEach(() => {
    rename.mockClear();
    remove.mockClear();
    useCollectionStore.setState({
      files: [{ path: 'requests/foo.ivk', name: 'foo', content: 'GET https://x' }],
      inlineFiles: {},
      collectionPath: '/Users/me/work/api',
      activeFilePath: null,
    });
  });
  afterEach(() => {
    delete (window as unknown as Record<string, unknown>).isTauri;
    delete (window as unknown as Record<string, unknown>).__TAURI__;
    delete (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__;
  });

  it('renames on disk in Tauri 2 (window.isTauri set)', async () => {
    (window as unknown as Record<string, unknown>).isTauri = true;
    const next = await useCollectionStore.getState().renameFile('requests/foo.ivk', 'bar');
    expect(next).toBe('requests/bar.ivk');
    expect(rename).toHaveBeenCalledWith(
      '/Users/me/work/api/requests/foo.ivk',
      '/Users/me/work/api/requests/bar.ivk',
    );
  });

  it('renames on disk in Tauri 2 (window.__TAURI_INTERNALS__ set)', async () => {
    (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__ = {};
    await useCollectionStore.getState().renameFile('requests/foo.ivk', 'bar');
    expect(rename).toHaveBeenCalledTimes(1);
  });

  it('still renames on disk in Tauri 1 (window.__TAURI__ set) — no regression', async () => {
    (window as unknown as Record<string, unknown>).__TAURI__ = {};
    await useCollectionStore.getState().renameFile('requests/foo.ivk', 'bar');
    expect(rename).toHaveBeenCalledTimes(1);
  });

  it('does NOT touch disk in browser mode (no Tauri signals)', async () => {
    await useCollectionStore.getState().renameFile('requests/foo.ivk', 'bar');
    expect(rename).not.toHaveBeenCalled();
    // ...but the in-memory map should still be updated.
    const files = useCollectionStore.getState().files;
    expect(files[0]?.path).toBe('requests/bar.ivk');
  });

  it('does NOT touch disk for a virtual collection path even in Tauri', async () => {
    (window as unknown as Record<string, unknown>).isTauri = true;
    useCollectionStore.setState({ collectionPath: '(sample)' });
    await useCollectionStore.getState().renameFile('requests/foo.ivk', 'bar');
    expect(rename).not.toHaveBeenCalled();
  });

  it('handles a collectionPath that already ends with a slash', async () => {
    (window as unknown as Record<string, unknown>).isTauri = true;
    useCollectionStore.setState({ collectionPath: '/Users/me/work/api/' });
    await useCollectionStore.getState().renameFile('requests/foo.ivk', 'bar');
    expect(rename).toHaveBeenCalledWith(
      '/Users/me/work/api/requests/foo.ivk',
      '/Users/me/work/api/requests/bar.ivk',
    );
  });

  it('aborts BEFORE in-memory mutation when fs.rename throws', async () => {
    (window as unknown as Record<string, unknown>).isTauri = true;
    rename.mockRejectedValueOnce(new Error('EACCES: permission denied'));
    await expect(
      useCollectionStore.getState().renameFile('requests/foo.ivk', 'bar'),
    ).rejects.toThrow('EACCES');
    // Original file still in the store — no divergence.
    const files = useCollectionStore.getState().files;
    expect(files[0]?.path).toBe('requests/foo.ivk');
  });

  it('does NOT touch disk for inline files even in Tauri', async () => {
    (window as unknown as Record<string, unknown>).isTauri = true;
    useCollectionStore.setState({
      files: [],
      inlineFiles: {
        'inline/Untitled-x.ivk': {
          path: 'inline/Untitled-x.ivk',
          name: 'Untitled',
          content: 'GET https://',
        },
      },
    });
    const next = await useCollectionStore.getState().renameFile('inline/Untitled-x.ivk', 'foo');
    expect(next).toBe('inline/foo.ivk');
    expect(rename).not.toHaveBeenCalled();
  });
});

describe('collection-store.deleteFile — Tauri disk integration', () => {
  beforeEach(() => {
    rename.mockClear();
    remove.mockClear();
    useCollectionStore.setState({
      files: [{ path: 'requests/foo.ivk', name: 'foo', content: 'GET https://x' }],
      inlineFiles: {},
      collectionPath: '/Users/me/work/api',
      activeFilePath: null,
    });
  });
  afterEach(() => {
    delete (window as unknown as Record<string, unknown>).isTauri;
    delete (window as unknown as Record<string, unknown>).__TAURI__;
    delete (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__;
  });

  it('removes from disk in Tauri 2 (window.isTauri set)', async () => {
    (window as unknown as Record<string, unknown>).isTauri = true;
    const ok = await useCollectionStore.getState().deleteFile('requests/foo.ivk');
    expect(ok).toBe(true);
    expect(remove).toHaveBeenCalledWith('/Users/me/work/api/requests/foo.ivk');
  });

  it('removes from disk in Tauri 2 (window.__TAURI_INTERNALS__ set)', async () => {
    (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__ = {};
    await useCollectionStore.getState().deleteFile('requests/foo.ivk');
    expect(remove).toHaveBeenCalledTimes(1);
  });

  it('still removes from disk in Tauri 1 (window.__TAURI__ set)', async () => {
    (window as unknown as Record<string, unknown>).__TAURI__ = {};
    await useCollectionStore.getState().deleteFile('requests/foo.ivk');
    expect(remove).toHaveBeenCalledTimes(1);
  });

  it('does NOT touch disk in browser mode', async () => {
    await useCollectionStore.getState().deleteFile('requests/foo.ivk');
    expect(remove).not.toHaveBeenCalled();
    expect(useCollectionStore.getState().files).toHaveLength(0);
  });

  it('does NOT touch disk for a virtual collection path', async () => {
    (window as unknown as Record<string, unknown>).isTauri = true;
    useCollectionStore.setState({ collectionPath: '(sample)' });
    await useCollectionStore.getState().deleteFile('requests/foo.ivk');
    expect(remove).not.toHaveBeenCalled();
  });

  it('handles a collectionPath that already ends with a slash', async () => {
    (window as unknown as Record<string, unknown>).isTauri = true;
    useCollectionStore.setState({ collectionPath: '/Users/me/work/api/' });
    await useCollectionStore.getState().deleteFile('requests/foo.ivk');
    expect(remove).toHaveBeenCalledWith('/Users/me/work/api/requests/foo.ivk');
  });

  it('aborts BEFORE in-memory mutation when fs.remove throws', async () => {
    (window as unknown as Record<string, unknown>).isTauri = true;
    remove.mockRejectedValueOnce(new Error('EACCES: permission denied'));
    await expect(
      useCollectionStore.getState().deleteFile('requests/foo.ivk'),
    ).rejects.toThrow('EACCES');
    // Original file still in the store.
    expect(useCollectionStore.getState().files).toHaveLength(1);
  });

  it('does NOT touch disk for inline files even in Tauri', async () => {
    (window as unknown as Record<string, unknown>).isTauri = true;
    useCollectionStore.setState({
      files: [],
      inlineFiles: {
        'inline/Untitled-x.ivk': {
          path: 'inline/Untitled-x.ivk',
          name: 'Untitled',
          content: 'GET https://',
        },
      },
    });
    await useCollectionStore.getState().deleteFile('inline/Untitled-x.ivk');
    expect(remove).not.toHaveBeenCalled();
  });
});
