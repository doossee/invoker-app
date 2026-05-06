import { beforeEach, describe, expect, it } from 'vitest';
import { useEnvStore } from './env-store';

/**
 * Regression: `addEnvironment(name)` created envs without a `color`
 * field. Combined with the Sidebar fix in PR #72 (which made env
 * dots prefer `env.color ?? ENV_COLORS[name] ?? fg3`), a custom env
 * name like "qa" produced a muted-gray dot — visually
 * indistinguishable from a missing/null env. Default envs (`dev`,
 * `stage`) populated by `loadSettings` shipped with explicit colors,
 * so the inconsistency was hard to spot.
 *
 * The fix: pick a color from a small palette of visually-distinct
 * hues, biased away from colors already in use, so every new env
 * gets a meaningful dot from the moment it's added.
 */
describe('env-store.addEnvironment — color assignment', () => {
  beforeEach(() => {
    localStorage.clear();
    useEnvStore.setState({
      settings: {
        environments: [],
        activeEnvironmentIndex: 0,
        timeout: 30000,
      },
    });
  });

  it('assigns a non-empty color string to a freshly added env', () => {
    useEnvStore.getState().addEnvironment('qa');
    const env = useEnvStore.getState().settings.environments[0];
    expect(env?.color).toBeTruthy();
    expect(typeof env?.color).toBe('string');
    expect(env?.color).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('picks distinct colors for multiple envs added in sequence', () => {
    useEnvStore.getState().addEnvironment('a');
    useEnvStore.getState().addEnvironment('b');
    useEnvStore.getState().addEnvironment('c');
    const colors = useEnvStore
      .getState()
      .settings.environments.map((e) => e.color);
    expect(new Set(colors).size).toBe(3); // all distinct
  });

  it('cycles through the palette without crashing past its size', () => {
    // Add more envs than the palette has hues — last few should still
    // get valid colors (cycle wraps).
    for (let i = 0; i < 12; i++) {
      useEnvStore.getState().addEnvironment(`env${i}`);
    }
    const envs = useEnvStore.getState().settings.environments;
    expect(envs).toHaveLength(12);
    for (const env of envs) {
      expect(env.color).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});
