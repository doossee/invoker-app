/**
 * Regression: `loadSettings()` did `JSON.parse(stored) as InvokerSettings`
 * with a try/catch around the JSON parse only. If localStorage held
 * valid JSON of the wrong shape (older Invoker version, manually
 * edited, partial corruption from a past write), the cast accepted
 * garbage and downstream consumers crashed when reading
 * `settings.environments[N].variables` etc.
 *
 * The fix: validate the parsed shape too. If any structural check
 * fails, fall through to the same default-settings path the catch
 * branch uses. We don't try to repair partial data — corrupted
 * state means the user lost some config (rare) but the app keeps
 * working.
 *
 * Tests below run vitest in-band, so they exercise `loadSettings`
 * indirectly via the store's first read. We pre-seed localStorage
 * BEFORE importing the store (vi.resetModules on top), then assert
 * the loaded settings.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const STORAGE_KEY = 'invoker:env';

async function freshStore() {
  // Re-import the store so its top-level loadSettings() runs against
  // the current localStorage state.
  vi.resetModules();
  const mod = await import('./env-store');
  return mod.useEnvStore;
}

describe('env-store loadSettings — shape validation', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    localStorage.clear();
  });

  it('falls through to defaults when localStorage holds invalid JSON', async () => {
    localStorage.setItem(STORAGE_KEY, '{ malformed json [[[');
    const useEnvStore = await freshStore();
    const envs = useEnvStore.getState().settings.environments;
    expect(envs.length).toBeGreaterThan(0);
    expect(envs[0]?.name).toBe('dev'); // default
  });

  it('falls through to defaults when stored JSON is not an object', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify('hello'));
    const useEnvStore = await freshStore();
    expect(useEnvStore.getState().settings.environments[0]?.name).toBe('dev');
  });

  it('falls through to defaults when `environments` is missing', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ activeEnvironmentIndex: 0 }));
    const useEnvStore = await freshStore();
    expect(useEnvStore.getState().settings.environments[0]?.name).toBe('dev');
  });

  it('falls through to defaults when `environments` is not an array', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ environments: 'not an array', activeEnvironmentIndex: 0 }),
    );
    const useEnvStore = await freshStore();
    expect(useEnvStore.getState().settings.environments[0]?.name).toBe('dev');
  });

  it('falls through to defaults when an entry is missing `name` or `variables`', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ environments: [{ name: 'dev' /* no variables */ }], activeEnvironmentIndex: 0 }),
    );
    const useEnvStore = await freshStore();
    // Should restore the multi-env default, not the single broken entry.
    expect(useEnvStore.getState().settings.environments).toHaveLength(2);
  });

  it('keeps a well-formed stored value', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        environments: [{ name: 'qa', variables: { baseUrl: 'https://x' } }],
        activeEnvironmentIndex: 0,
        timeout: 30000,
      }),
    );
    const useEnvStore = await freshStore();
    const envs = useEnvStore.getState().settings.environments;
    expect(envs).toHaveLength(1);
    expect(envs[0]?.name).toBe('qa');
  });

  it('accepts entries whose `color` is missing (legacy data)', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        environments: [{ name: 'legacy', variables: {} }], // no color field
        activeEnvironmentIndex: 0,
        timeout: 30000,
      }),
    );
    const useEnvStore = await freshStore();
    const envs = useEnvStore.getState().settings.environments;
    expect(envs).toHaveLength(1);
    expect(envs[0]?.name).toBe('legacy');
  });

  it('falls through to defaults when activeEnvironmentIndex is out of range', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        environments: [{ name: 'qa', variables: {} }],
        activeEnvironmentIndex: 99, // way beyond the array
        timeout: 30000,
      }),
    );
    const useEnvStore = await freshStore();
    // Coerced — either to 0 or fall through to defaults. Either way,
    // active env must resolve to a valid env.
    const idx = useEnvStore.getState().settings.activeEnvironmentIndex;
    const envs = useEnvStore.getState().settings.environments;
    expect(envs[idx]).toBeDefined();
  });
});
