import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useCollectionStore } from './collection-store';

/**
 * Pins the Tauri-detection fix for `saveRequest`. The previous inline
 * `'__TAURI__' in window` check matched Tauri 1 only — Tauri 2 sets
 * `window.isTauri` and `window.__TAURI_INTERNALS__`, so the desktop
 * build silently fell through to "no disk write" and ⌘S did nothing.
 *
 * Now uses the shared `isTauri()` helper which checks all three
 * signals. Also covers the inverse: in browser-mode, saveRequest must
 * NOT try to import @tauri-apps/plugin-fs.
 */

const writeTextFile = vi.fn(async () => undefined);

vi.mock('@tauri-apps/plugin-fs', () => ({
  writeTextFile: (...args: unknown[]) => writeTextFile(...args),
}));

describe('collection-store.saveRequest — Tauri detection', () => {
  beforeEach(() => {
    writeTextFile.mockClear();
    useCollectionStore.setState({
      files: [{ path: 'requests/foo.ivk', name: 'foo', content: 'GET https://x' }],
      inlineFiles: {},
      collectionPath: '/Users/me/work/api',
      activeFilePath: null,
    });
  });
  afterEach(() => {
    // Restore window globals between tests so each scenario starts clean.
    delete (window as unknown as Record<string, unknown>).isTauri;
    delete (window as unknown as Record<string, unknown>).__TAURI__;
    delete (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__;
  });

  it('writes to disk in Tauri 2 (window.isTauri set)', async () => {
    (window as unknown as Record<string, unknown>).isTauri = true;
    const ok = await useCollectionStore
      .getState()
      .saveRequest('requests/foo.ivk', 'GET https://updated');
    expect(ok).toBe(true);
    expect(writeTextFile).toHaveBeenCalledWith(
      '/Users/me/work/api/requests/foo.ivk',
      'GET https://updated',
    );
  });

  it('writes to disk in Tauri 2 (window.__TAURI_INTERNALS__ set)', async () => {
    (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__ = {};
    const ok = await useCollectionStore
      .getState()
      .saveRequest('requests/foo.ivk', 'GET https://updated');
    expect(ok).toBe(true);
    expect(writeTextFile).toHaveBeenCalledTimes(1);
  });

  it('still writes to disk in Tauri 1 (window.__TAURI__ set) — no regression', async () => {
    (window as unknown as Record<string, unknown>).__TAURI__ = {};
    const ok = await useCollectionStore
      .getState()
      .saveRequest('requests/foo.ivk', 'GET https://updated');
    expect(ok).toBe(true);
    expect(writeTextFile).toHaveBeenCalledTimes(1);
  });

  it('does NOT touch disk when none of the Tauri signals are set (browser mode)', async () => {
    const ok = await useCollectionStore
      .getState()
      .saveRequest('requests/foo.ivk', 'GET https://updated');
    expect(ok).toBe(false);
    expect(writeTextFile).not.toHaveBeenCalled();
  });

  it('does NOT touch disk for a virtual collection path even in Tauri', async () => {
    (window as unknown as Record<string, unknown>).isTauri = true;
    useCollectionStore.setState({ collectionPath: '(sample)' });
    const ok = await useCollectionStore
      .getState()
      .saveRequest('requests/foo.ivk', 'GET https://updated');
    expect(ok).toBe(false);
    expect(writeTextFile).not.toHaveBeenCalled();
  });

  it('handles a collectionPath that already ends with a slash', async () => {
    (window as unknown as Record<string, unknown>).isTauri = true;
    useCollectionStore.setState({ collectionPath: '/Users/me/work/api/' });
    await useCollectionStore.getState().saveRequest('foo.ivk', 'GET https://x');
    expect(writeTextFile).toHaveBeenCalledWith('/Users/me/work/api/foo.ivk', 'GET https://x');
  });
});
