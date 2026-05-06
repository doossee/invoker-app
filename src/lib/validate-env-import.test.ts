import { describe, it, expect } from 'vitest';
import { validateEnvImport } from './validate-env-import';

/**
 * Unit coverage for the Settings → Environments → Import JSON
 * validator. Previously the import path did `parsed as
 * IvkEnvironment[]` after a top-level `Array.isArray` check — any
 * array of arbitrary shape (e.g. `[1, 2, 3]`,
 * `[{ name: "x" }]` without variables) was accepted, then crashed
 * downstream where `varCount(env) = Object.keys(env.variables).length`
 * threw on undefined.
 *
 * Validator returns a discriminated union — `ok: true` with the
 * coerced env list, or `ok: false` with a human-readable error
 * message that the modal can render in red.
 */
describe('validateEnvImport', () => {
  it('accepts a well-formed env list', () => {
    const r = validateEnvImport([
      { name: 'dev', variables: { baseUrl: 'https://x' } },
      { name: 'stage', variables: {}, color: '#abcdef' },
    ]);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.envs).toHaveLength(2);
      expect(r.envs[0]).toEqual({ name: 'dev', variables: { baseUrl: 'https://x' } });
      expect(r.envs[1]).toEqual({ name: 'stage', variables: {}, color: '#abcdef' });
    }
  });

  it('rejects non-array input', () => {
    const r = validateEnvImport({ name: 'dev', variables: {} });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/array/i);
  });

  it('rejects entries missing `name`', () => {
    const r = validateEnvImport([{ variables: {} }]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/name/i);
  });

  it('rejects entries with non-string `name`', () => {
    const r = validateEnvImport([{ name: 42, variables: {} }]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/name/i);
  });

  it('rejects entries with empty-string `name`', () => {
    const r = validateEnvImport([{ name: '', variables: {} }]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/name/i);
  });

  it('rejects entries missing `variables`', () => {
    const r = validateEnvImport([{ name: 'dev' }]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/variables/i);
  });

  it('rejects entries where `variables` is not an object', () => {
    const r = validateEnvImport([{ name: 'dev', variables: 'oops' }]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/variables/i);
  });

  it('rejects entries where `variables` is an array (objects only)', () => {
    const r = validateEnvImport([{ name: 'dev', variables: [] }]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/variables/i);
  });

  it('rejects entries where `variables` has non-string values', () => {
    const r = validateEnvImport([{ name: 'dev', variables: { x: 42 } }]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/variables/i);
  });

  it('coerces null `color` to undefined', () => {
    const r = validateEnvImport([{ name: 'dev', variables: {}, color: null }]);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.envs[0]).toEqual({ name: 'dev', variables: {} });
  });

  it('rejects an empty array (must have at least one env)', () => {
    const r = validateEnvImport([]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/at least one/i);
  });

  it('rejects primitive entries', () => {
    const r = validateEnvImport([1, 2, 3]);
    expect(r.ok).toBe(false);
  });

  it('strips unknown extra fields silently (forward-compat)', () => {
    const r = validateEnvImport([
      { name: 'dev', variables: {}, futureField: 'ignored' },
    ]);
    expect(r.ok).toBe(true);
    if (r.ok) {
      // Only known fields make it into the coerced output.
      expect(r.envs[0]).toEqual({ name: 'dev', variables: {} });
      expect((r.envs[0] as unknown as Record<string, unknown>).futureField).toBeUndefined();
    }
  });

  it('reports the index of the first bad entry for diagnostics', () => {
    const r = validateEnvImport([
      { name: 'dev', variables: {} },
      { name: 'stage' /* no variables */ },
    ]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/index 1|env 1|stage/i);
  });
});
