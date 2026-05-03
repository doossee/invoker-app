import { beforeEach, describe, expect, it } from 'vitest';
import { useEnvStore } from './env-store';

/**
 * Regression: `resetToDefaults` mutated the active env's `variables`
 * object in place (`env.variables = { ...defaults }`) and then called
 * `set({ settings: { ...state.settings } })`. The shallow clone only
 * touched the top-level settings object — the `environments` array
 * reference and the env-at-index-i reference were unchanged.
 *
 * Result: zustand selectors that subscribe to deeper paths
 * (`s.settings.environments`, `s.settings.environments[i]`,
 * `s.settings.environments[i].variables`) saw the same references and
 * skipped the re-render. The reset wasn't visually applied unless the
 * component happened to re-render for an unrelated reason.
 *
 * Fix: rebuild the environments array immutably so every level gets a
 * new reference, and a fresh `variables` object on the target env
 * specifically.
 */
describe('env-store.resetToDefaults — immutable update contract', () => {
  beforeEach(() => {
    localStorage.clear();
    useEnvStore.setState({
      settings: {
        environments: [
          { name: 'dev', variables: { baseUrl: 'https://dev.example.com', apiKey: 'OVERRIDDEN' } },
          { name: 'stage', variables: { baseUrl: 'https://stage.example.com' } },
        ],
        activeEnvironmentIndex: 0,
        timeout: 30000,
      },
      authorDefaults: { baseUrl: 'https://author.example.com', apiKey: 'AUTHOR_DEFAULT' },
    });
  });

  it('replaces the active env variables with the author defaults', () => {
    useEnvStore.getState().resetToDefaults();
    const env = useEnvStore.getState().settings.environments[0];
    expect(env?.variables).toEqual({
      baseUrl: 'https://author.example.com',
      apiKey: 'AUTHOR_DEFAULT',
    });
  });

  it('produces a new environments-array reference (zustand subscribers re-render)', () => {
    const before = useEnvStore.getState().settings.environments;
    useEnvStore.getState().resetToDefaults();
    const after = useEnvStore.getState().settings.environments;
    expect(after).not.toBe(before); // different reference
  });

  it('produces a new env-at-active-index reference', () => {
    const before = useEnvStore.getState().settings.environments[0];
    useEnvStore.getState().resetToDefaults();
    const after = useEnvStore.getState().settings.environments[0];
    expect(after).not.toBe(before);
  });

  it('produces a new variables-object reference', () => {
    const before = useEnvStore.getState().settings.environments[0]?.variables;
    useEnvStore.getState().resetToDefaults();
    const after = useEnvStore.getState().settings.environments[0]?.variables;
    expect(after).not.toBe(before);
  });

  it('does NOT touch other (non-active) envs — same reference preserved', () => {
    const stageBefore = useEnvStore.getState().settings.environments[1];
    useEnvStore.getState().resetToDefaults();
    const stageAfter = useEnvStore.getState().settings.environments[1];
    expect(stageAfter).toBe(stageBefore); // same reference (untouched)
  });

  it('no-ops when there is no active env', () => {
    useEnvStore.setState({
      settings: { environments: [], activeEnvironmentIndex: 0, timeout: 30000 },
    });
    expect(() => useEnvStore.getState().resetToDefaults()).not.toThrow();
  });
});

describe('env-store.setVariable — immutable update contract', () => {
  beforeEach(() => {
    localStorage.clear();
    useEnvStore.setState({
      settings: {
        environments: [
          { name: 'dev', variables: { existing: 'old' } },
          { name: 'stage', variables: {} },
        ],
        activeEnvironmentIndex: 0,
        timeout: 30000,
      },
    });
  });

  it('produces a new variables-object reference when setting a var', () => {
    const before = useEnvStore.getState().settings.environments[0]?.variables;
    useEnvStore.getState().setVariable('newKey', 'value');
    const after = useEnvStore.getState().settings.environments[0]?.variables;
    expect(after).not.toBe(before);
    expect(after).toEqual({ existing: 'old', newKey: 'value' });
  });

  it('produces a new env-at-active-index reference', () => {
    const before = useEnvStore.getState().settings.environments[0];
    useEnvStore.getState().setVariable('newKey', 'value');
    const after = useEnvStore.getState().settings.environments[0];
    expect(after).not.toBe(before);
  });

  it('preserves non-active env references', () => {
    const stageBefore = useEnvStore.getState().settings.environments[1];
    useEnvStore.getState().setVariable('newKey', 'value');
    const stageAfter = useEnvStore.getState().settings.environments[1];
    expect(stageAfter).toBe(stageBefore);
  });
});
