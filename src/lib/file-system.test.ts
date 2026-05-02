import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: vi.fn(),
}));
vi.mock('@tauri-apps/plugin-fs', () => ({
  readDir: vi.fn(),
  readTextFile: vi.fn(),
}));

import { openCollectionDialog, loadCollection } from './file-system';
import { open as mockOpen } from '@tauri-apps/plugin-dialog';
import { readDir as mockReadDir, readTextFile as mockReadTextFile } from '@tauri-apps/plugin-fs';

function setTauri(present: boolean) {
  if (present) {
    (window as unknown as Record<string, unknown>).__TAURI__ = {};
  } else {
    delete (window as unknown as Record<string, unknown>).__TAURI__;
  }
}

/**
 * Build a readDir mock from a flat path → entries map. Any path NOT in the
 * map returns an empty array — important because `mockResolvedValue` would
 * return the SAME array for every recursive call, causing infinite recursion
 * on directory entries that the implementation tries to walk into.
 */
function fsFixture(map: Record<string, Array<{ name: string; isDirectory: boolean }>>) {
  vi.mocked(mockReadDir).mockImplementation(async (path) => {
    const entries = map[String(path)];
    if (entries === undefined) return [] as never;
    return entries.map((e) => ({
      name: e.name,
      isDirectory: e.isDirectory,
      isFile: !e.isDirectory,
      isSymlink: false,
    })) as never;
  });
}

describe('openCollectionDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setTauri(false);
  });
  afterEach(() => setTauri(false));

  it('returns null when not Tauri (no dialog invocation)', async () => {
    expect(await openCollectionDialog()).toBeNull();
    expect(mockOpen).not.toHaveBeenCalled();
  });

  it('returns the selected path when Tauri returns a string', async () => {
    setTauri(true);
    vi.mocked(mockOpen).mockResolvedValue('/Users/me/projects/my-collection');
    expect(await openCollectionDialog()).toBe('/Users/me/projects/my-collection');
    expect(mockOpen).toHaveBeenCalledWith({
      directory: true,
      multiple: false,
      title: 'Open Collection Folder',
    });
  });

  it('returns null when Tauri dialog is cancelled', async () => {
    setTauri(true);
    vi.mocked(mockOpen).mockResolvedValue(null);
    expect(await openCollectionDialog()).toBeNull();
  });

  it('returns null when dialog returns an unexpected non-string value', async () => {
    setTauri(true);
    vi.mocked(mockOpen).mockResolvedValue(['/foo'] as unknown as string);
    expect(await openCollectionDialog()).toBeNull();
  });
});

describe('loadCollection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setTauri(false);
  });
  afterEach(() => setTauri(false));

  it('returns the sample collection in non-Tauri environment', async () => {
    const result = await loadCollection('/some/path');
    expect(result.basePath).toBe('(sample)');
    expect(result.ivkFiles.length).toBeGreaterThan(0);
    expect(mockReadDir).not.toHaveBeenCalled();
  });

  it('returns the sample collection when path is null', async () => {
    setTauri(true);
    const result = await loadCollection(null);
    expect(result.basePath).toBe('(sample)');
    expect(mockReadDir).not.toHaveBeenCalled();
  });

  it('reads .ivk and .md files at the top level', async () => {
    setTauri(true);
    fsFixture({
      '/Users/me/coll': [
        { name: 'request.ivk', isDirectory: false },
        { name: 'README.md', isDirectory: false },
        { name: 'image.png', isDirectory: false },
      ],
    });
    vi.mocked(mockReadTextFile).mockImplementation(async (path) => {
      if (typeof path === 'string' && path.endsWith('request.ivk')) return 'GET /api';
      if (typeof path === 'string' && path.endsWith('README.md')) return '# Hello';
      throw new Error('unexpected file: ' + String(path));
    });

    const result = await loadCollection('/Users/me/coll');

    expect(result.basePath).toBe('/Users/me/coll');
    expect(result.ivkFiles).toHaveLength(1);
    expect(result.ivkFiles[0]).toEqual({
      path: 'request.ivk',
      name: 'request',
      content: 'GET /api',
    });
    expect(result.mdFiles).toHaveLength(1);
    expect(result.mdFiles[0]).toEqual({
      path: 'README.md',
      // Current behavior: capitalize first letter at word boundaries.
      // "README" already starts with uppercase, so nothing changes.
      // "user-guide.md" → "User Guide", "api_intro.md" → "Api Intro".
      title: 'README',
      content: '# Hello',
    });
  });

  it('recurses into subdirectories with correct relative paths', async () => {
    setTauri(true);
    fsFixture({
      '/Users/me/coll': [
        { name: 'top.ivk', isDirectory: false },
        { name: 'nested', isDirectory: true },
      ],
      '/Users/me/coll/nested': [
        { name: 'inner.ivk', isDirectory: false },
      ],
    });
    vi.mocked(mockReadTextFile).mockResolvedValue('content');

    const result = await loadCollection('/Users/me/coll');
    expect(result.ivkFiles.map((f) => f.path).sort()).toEqual([
      'nested/inner.ivk',
      'top.ivk',
    ]);
  });

  it('skips dotfiles, node_modules, and dist directories', async () => {
    setTauri(true);
    fsFixture({
      '/Users/me/coll': [
        { name: '.git', isDirectory: true },
        { name: 'node_modules', isDirectory: true },
        { name: 'dist', isDirectory: true },
        { name: 'src', isDirectory: true },
      ],
      // Empty subdirs so 'src' is walked but yields nothing.
      '/Users/me/coll/src': [],
    });

    await loadCollection('/Users/me/coll');

    expect(mockReadDir).toHaveBeenCalledTimes(2);
    expect(mockReadDir).toHaveBeenNthCalledWith(1, '/Users/me/coll');
    expect(mockReadDir).toHaveBeenNthCalledWith(2, '/Users/me/coll/src');
  });

  it('skips .md files starting with underscore', async () => {
    setTauri(true);
    fsFixture({
      '/Users/me/coll': [
        { name: '_partial.md', isDirectory: false },
        { name: 'public.md', isDirectory: false },
      ],
    });
    vi.mocked(mockReadTextFile).mockResolvedValue('content');

    const result = await loadCollection('/Users/me/coll');
    expect(result.mdFiles.map((f) => f.path)).toEqual(['public.md']);
  });

  it('returns empty collection when readDir fails on root', async () => {
    setTauri(true);
    vi.mocked(mockReadDir).mockRejectedValue(new Error('EACCES: permission denied'));

    const result = await loadCollection('/Users/me/coll');
    expect(result.basePath).toBe('/Users/me/coll');
    expect(result.ivkFiles).toEqual([]);
    expect(result.mdFiles).toEqual([]);
  });

  it('skips individual files that fail to read', async () => {
    setTauri(true);
    fsFixture({
      '/Users/me/coll': [
        { name: 'good.ivk', isDirectory: false },
        { name: 'bad.ivk', isDirectory: false },
      ],
    });
    vi.mocked(mockReadTextFile).mockImplementation(async (path) => {
      if (typeof path === 'string' && path.endsWith('bad.ivk')) {
        throw new Error('EACCES');
      }
      return 'content';
    });

    const result = await loadCollection('/Users/me/coll');
    expect(result.ivkFiles).toHaveLength(1);
    expect(result.ivkFiles[0].name).toBe('good');
  });

  it('sorts results alphabetically by path', async () => {
    setTauri(true);
    fsFixture({
      '/Users/me/coll': [
        { name: 'z.ivk', isDirectory: false },
        { name: 'a.ivk', isDirectory: false },
        { name: 'm.ivk', isDirectory: false },
      ],
    });
    vi.mocked(mockReadTextFile).mockResolvedValue('content');

    const result = await loadCollection('/Users/me/coll');
    expect(result.ivkFiles.map((f) => f.path)).toEqual(['a.ivk', 'm.ivk', 'z.ivk']);
  });
});
