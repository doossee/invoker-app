import { beforeEach, describe, expect, it } from 'vitest';
import { useCollectionStore } from './collection-store';

/**
 * Coverage for `createFile` + `createFolder` actions on the collection
 * store. Browser-mode in-memory only — Tauri disk integration lives
 * in `collection-store-tauri-create.test.ts` (mocks `@tauri-apps/
 * plugin-fs.writeTextFile` and `mkdir`).
 *
 * Same surface shape as the existing `renameFile` / `deleteFile`
 * actions added in PR #48 / #51:
 *   - Returns the new path on success
 *   - Returns null on conflict (file/folder already exists)
 *   - Inline / disk branching gated on `isTauri()` + virtual
 *     collection path
 */
describe('collection-store.createFile / createFolder', () => {
  beforeEach(() => {
    useCollectionStore.setState({
      files: [
        { path: 'playground/01-hello.ivk', name: '01-hello', content: 'GET https://x' },
      ],
      inlineFiles: {},
      activeFilePath: null,
      collectionPath: '(sample)',
    });
  });

  describe('createFile', () => {
    it('creates a new request inside a folder with the default seed', async () => {
      const path = await useCollectionStore
        .getState()
        .createFile('playground', 'new-request');
      expect(path).toBe('playground/new-request.ivk');
      const file = useCollectionStore
        .getState()
        .files.find((f) => f.path === 'playground/new-request.ivk');
      expect(file?.name).toBe('new-request');
      // Seed should be parseable + carry the default GET method so
      // the editor picks it up cleanly.
      expect(file?.content).toMatch(/^GET https:\/\//);
    });

    it('creates a request at the root when parentFolder is empty', async () => {
      const path = await useCollectionStore.getState().createFile('', 'top');
      expect(path).toBe('top.ivk');
    });

    it('appends `.ivk` if the user omits the extension', async () => {
      const path = await useCollectionStore
        .getState()
        .createFile('playground', 'foo');
      expect(path).toBe('playground/foo.ivk');
    });

    it('respects the user-provided extension if they typed `.ivk`', async () => {
      const path = await useCollectionStore
        .getState()
        .createFile('playground', 'foo.ivk');
      expect(path).toBe('playground/foo.ivk');
    });

    it('returns null on conflict (path already exists)', async () => {
      const path = await useCollectionStore
        .getState()
        .createFile('playground', '01-hello');
      expect(path).toBeNull();
    });

    it('also detects conflict with inline files', async () => {
      useCollectionStore.setState({
        inlineFiles: {
          'inline/x.ivk': { path: 'inline/x.ivk', name: 'x', content: 'GET https://' },
        },
      });
      const path = await useCollectionStore.getState().createFile('inline', 'x');
      expect(path).toBeNull();
    });

    it('honors the editor-store defaultRequestMethod', async () => {
      // Set the default to POST and verify the seed reflects it.
      const { useEditorStore } = await import('./editor-store');
      useEditorStore.getState().setDefaultRequestMethod('POST');
      const path = await useCollectionStore.getState().createFile('', 'p');
      const file = useCollectionStore.getState().files.find((f) => f.path === path);
      expect(file?.content).toMatch(/^POST /);
      // Restore for subsequent tests.
      useEditorStore.getState().setDefaultRequestMethod('GET');
    });
  });

  describe('createFolder', () => {
    it('creates a folder by writing a placeholder README.md (browser-mode)', async () => {
      // Browser-mode folders are derived from file paths — we need a
      // placeholder so the new folder actually shows up in the tree.
      // The placeholder lives in the docs-store (a `.md` file), so
      // we exercise the cross-store handoff via App-level wiring;
      // for the collection-store contract we just assert the call
      // returns the new folder path.
      const path = await useCollectionStore
        .getState()
        .createFolder('', 'new-folder');
      expect(path).toBe('new-folder');
    });

    it('nests a folder inside an existing folder', async () => {
      const path = await useCollectionStore
        .getState()
        .createFolder('playground', 'subfolder');
      expect(path).toBe('playground/subfolder');
    });

    it('returns null when a folder of that name already exists', async () => {
      // Folder existence is derived from the files in the store —
      // `playground` is implicit because `playground/01-hello.ivk`
      // exists.
      const path = await useCollectionStore
        .getState()
        .createFolder('', 'playground');
      expect(path).toBeNull();
    });
  });
});
