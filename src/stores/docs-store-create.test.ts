import { beforeEach, describe, expect, it } from 'vitest';
import { useDocsStore } from './docs-store';

/**
 * Coverage for `createDoc` action — companion to
 * `collection-store.createFile` for `.md` doc files.
 *
 * Same surface: returns the new path on success, null on conflict.
 * Tauri disk integration mirrors the existing `saveDoc` pattern.
 */
describe('docs-store.createDoc', () => {
  beforeEach(() => {
    useDocsStore.setState({
      docs: [
        { path: 'guide/intro.md', title: 'Intro', content: '# Intro' },
      ],
    });
  });

  it('creates an empty .md doc inside a folder', async () => {
    const path = await useDocsStore
      .getState()
      .createDoc('guide', 'getting-started', '(sample)');
    expect(path).toBe('guide/getting-started.md');
    const doc = useDocsStore
      .getState()
      .docs.find((d) => d.path === 'guide/getting-started.md');
    expect(doc?.content).toBe('');
    expect(doc?.title).toBe('getting-started');
  });

  it('creates at root when parentFolder is empty', async () => {
    const path = await useDocsStore.getState().createDoc('', 'README', '(sample)');
    expect(path).toBe('README.md');
  });

  it('appends `.md` if the user omits the extension', async () => {
    const path = await useDocsStore
      .getState()
      .createDoc('guide', 'tutorial', '(sample)');
    expect(path).toBe('guide/tutorial.md');
  });

  it('keeps the user-provided extension if they typed `.md`', async () => {
    const path = await useDocsStore
      .getState()
      .createDoc('guide', 'tutorial.md', '(sample)');
    expect(path).toBe('guide/tutorial.md');
  });

  it('returns null on conflict', async () => {
    const path = await useDocsStore
      .getState()
      .createDoc('guide', 'intro', '(sample)');
    expect(path).toBeNull();
  });

  it('seeds with caller-provided initial content if any', async () => {
    const path = await useDocsStore
      .getState()
      .createDoc('guide', 'spec', '(sample)', '# Spec\n\nDraft.');
    expect(path).toBe('guide/spec.md');
    const doc = useDocsStore
      .getState()
      .docs.find((d) => d.path === 'guide/spec.md');
    expect(doc?.content).toBe('# Spec\n\nDraft.');
  });
});
