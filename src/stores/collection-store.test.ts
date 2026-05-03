import { beforeEach, describe, expect, it } from 'vitest';
import { useCollectionStore } from './collection-store';

/**
 * Unit coverage for the renameFile / deleteFile actions added for the
 * sidebar tree right-click context menu. Originally browser-mode in-memory
 * only (PR #48); now both actions are async and write through to disk via
 * `@tauri-apps/plugin-fs.rename` / `.remove` when running in Tauri with a
 * real collection folder. Tauri-side coverage lives in
 * `collection-store-tauri-rename-delete.test.ts`.
 */
describe('collection-store rename / delete', () => {
  beforeEach(() => {
    useCollectionStore.setState({
      files: [
        { path: 'playground/01-hello-world.ivk', name: '01-hello-world', content: 'GET https://x' },
        { path: 'playground/02-with-headers.ivk', name: '02-with-headers', content: 'GET https://y' },
      ],
      inlineFiles: {},
      activeFilePath: null,
      collectionPath: '(sample)',
    });
  });

  it('renameFile moves the file in the in-memory map and updates name', async () => {
    const next = await useCollectionStore.getState().renameFile(
      'playground/01-hello-world.ivk',
      'hello',
    );
    expect(next).toBe('playground/hello.ivk');
    const files = useCollectionStore.getState().files;
    expect(files.find((f) => f.path === 'playground/hello.ivk')?.name).toBe('hello');
    expect(files.find((f) => f.path === 'playground/01-hello-world.ivk')).toBeUndefined();
  });

  it('renameFile appends `.ivk` if the user omits it', async () => {
    const next = await useCollectionStore.getState().renameFile(
      'playground/01-hello-world.ivk',
      'greetings',
    );
    expect(next).toBe('playground/greetings.ivk');
  });

  it('renameFile returns null on conflict (target already exists)', async () => {
    const next = await useCollectionStore.getState().renameFile(
      'playground/01-hello-world.ivk',
      '02-with-headers',
    );
    expect(next).toBeNull();
    // Originals unchanged.
    const paths = useCollectionStore.getState().files.map((f) => f.path);
    expect(paths).toContain('playground/01-hello-world.ivk');
    expect(paths).toContain('playground/02-with-headers.ivk');
  });

  it('renameFile updates activeFilePath when the renamed file was active', async () => {
    useCollectionStore.setState({ activeFilePath: 'playground/01-hello-world.ivk' });
    await useCollectionStore.getState().renameFile('playground/01-hello-world.ivk', 'hi');
    expect(useCollectionStore.getState().activeFilePath).toBe('playground/hi.ivk');
  });

  it('deleteFile removes a real file and clears activeFilePath if it was active', async () => {
    useCollectionStore.setState({ activeFilePath: 'playground/01-hello-world.ivk' });
    const ok = await useCollectionStore.getState().deleteFile('playground/01-hello-world.ivk');
    expect(ok).toBe(true);
    expect(
      useCollectionStore.getState().files.find((f) => f.path === 'playground/01-hello-world.ivk'),
    ).toBeUndefined();
    expect(useCollectionStore.getState().activeFilePath).toBeNull();
  });

  it('deleteFile returns false when the path is not in the store', async () => {
    const ok = await useCollectionStore.getState().deleteFile('does/not-exist.ivk');
    expect(ok).toBe(false);
  });

  it('deleteFile removes inline files', async () => {
    useCollectionStore.setState({
      inlineFiles: {
        'inline/Untitled-x.ivk': {
          path: 'inline/Untitled-x.ivk',
          name: 'Untitled',
          content: 'GET https://',
        },
      },
    });
    const ok = await useCollectionStore.getState().deleteFile('inline/Untitled-x.ivk');
    expect(ok).toBe(true);
    expect(useCollectionStore.getState().inlineFiles['inline/Untitled-x.ivk']).toBeUndefined();
  });
});
