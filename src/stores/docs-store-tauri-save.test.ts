import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDocsStore } from './docs-store';

/**
 * Same Tauri-detection bug as `collection-store.saveRequest`, same fix.
 * `saveDoc` used the inline `'__TAURI__' in window` check that only
 * matched Tauri 1 — Tauri 2's desktop build silently fell through to
 * the no-write branch.
 */

const writeTextFile = vi.fn(async () => undefined);

vi.mock('@tauri-apps/plugin-fs', () => ({
  writeTextFile: (...args: unknown[]) => writeTextFile(...args),
}));

describe('docs-store.saveDoc — Tauri detection', () => {
  beforeEach(() => {
    writeTextFile.mockClear();
    useDocsStore.setState({
      docs: [{ path: 'README.md', title: 'Readme', content: '# old' }],
    });
  });
  afterEach(() => {
    delete (window as unknown as Record<string, unknown>).isTauri;
    delete (window as unknown as Record<string, unknown>).__TAURI__;
    delete (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__;
  });

  it('writes to disk in Tauri 2 (window.isTauri set)', async () => {
    (window as unknown as Record<string, unknown>).isTauri = true;
    const ok = await useDocsStore
      .getState()
      .saveDoc('README.md', '# new', '/Users/me/work/api');
    expect(ok).toBe(true);
    expect(writeTextFile).toHaveBeenCalledWith('/Users/me/work/api/README.md', '# new');
  });

  it('still writes to disk in Tauri 1 (window.__TAURI__ set) — no regression', async () => {
    (window as unknown as Record<string, unknown>).__TAURI__ = {};
    const ok = await useDocsStore
      .getState()
      .saveDoc('README.md', '# new', '/Users/me/work/api');
    expect(ok).toBe(true);
    expect(writeTextFile).toHaveBeenCalledTimes(1);
  });

  it('does NOT touch disk in browser mode', async () => {
    const ok = await useDocsStore
      .getState()
      .saveDoc('README.md', '# new', '/Users/me/work/api');
    expect(ok).toBe(false);
    expect(writeTextFile).not.toHaveBeenCalled();
  });

  it('does NOT touch disk for a virtual collection path even in Tauri', async () => {
    (window as unknown as Record<string, unknown>).isTauri = true;
    const ok = await useDocsStore.getState().saveDoc('README.md', '# new', '(sample)');
    expect(ok).toBe(false);
    expect(writeTextFile).not.toHaveBeenCalled();
  });
});
