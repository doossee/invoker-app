import type { IvkEnvironment } from 'ivkjs';

/**
 * Discriminated-union result for validating a JSON blob pasted into
 * Settings → Environments → Import.
 */
export type ValidateResult =
  | { ok: true; envs: IvkEnvironment[] }
  | { ok: false; error: string };

/**
 * Validate + coerce arbitrary JSON into a list of IvkEnvironment.
 *
 * Background: the import flow used to do `parsed as IvkEnvironment[]`
 * after a top-level `Array.isArray` check. Any array of arbitrary
 * shape was accepted, then crashed downstream where downstream code
 * read `env.variables`/`env.name` as if they existed (e.g. `varCount`
 * → `Object.keys(env.variables).length` throws on undefined).
 *
 * Rules — keep aligned with `IvkEnvironment` in ivkjs:
 *   - Must be a non-empty array
 *   - Each entry must be a plain object
 *   - `name` must be a non-empty string
 *   - `variables` must be a plain object (record), every value a string
 *   - `color` is optional; null → undefined
 *   - Unknown keys are dropped silently (forward-compat for new ivkjs
 *     fields that haven't been added to the validator yet)
 *
 * Error messages name the failing field/entry so users can fix the
 * paste without trial-and-error.
 */
export function validateEnvImport(raw: unknown): ValidateResult {
  if (!Array.isArray(raw)) {
    return { ok: false, error: 'Expected an array of environments at the top level.' };
  }
  if (raw.length === 0) {
    return { ok: false, error: 'Need at least one environment.' };
  }
  const out: IvkEnvironment[] = [];
  for (let i = 0; i < raw.length; i++) {
    const item = raw[i];
    if (typeof item !== 'object' || item === null || Array.isArray(item)) {
      return { ok: false, error: `Entry at index ${i} must be an object.` };
    }
    const obj = item as Record<string, unknown>;
    const name = obj.name;
    if (typeof name !== 'string' || name.trim() === '') {
      return {
        ok: false,
        error: `Entry at index ${i}: missing or empty "name" (must be a non-empty string).`,
      };
    }
    const variables = obj.variables;
    if (
      typeof variables !== 'object' ||
      variables === null ||
      Array.isArray(variables)
    ) {
      return {
        ok: false,
        error: `Entry at index ${i} ("${name}"): missing or invalid "variables" (must be an object).`,
      };
    }
    const varEntries = variables as Record<string, unknown>;
    const cleanedVars: Record<string, string> = {};
    for (const [k, v] of Object.entries(varEntries)) {
      if (typeof v !== 'string') {
        return {
          ok: false,
          error: `Entry at index ${i} ("${name}"): variables.${k} must be a string.`,
        };
      }
      cleanedVars[k] = v;
    }
    const env: IvkEnvironment = { name, variables: cleanedVars };
    if (typeof obj.color === 'string') env.color = obj.color;
    // Other fields (futureField, etc.) silently dropped.
    out.push(env);
  }
  return { ok: true, envs: out };
}
