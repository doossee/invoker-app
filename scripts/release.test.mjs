import test from 'node:test';
import assert from 'node:assert/strict';
import { validateVersion } from './release.mjs';

test('validateVersion accepts simple semver', () => {
  assert.deepEqual(validateVersion('1.2.3'), { ok: true, version: '1.2.3' });
});

test('validateVersion accepts pre-release tags', () => {
  assert.deepEqual(validateVersion('1.2.3-rc.1'), { ok: true, version: '1.2.3-rc.1' });
  assert.deepEqual(validateVersion('0.1.0-beta'), { ok: true, version: '0.1.0-beta' });
});

test('validateVersion rejects non-semver', () => {
  for (const bad of ['', '1', '1.2', '1.2.3.4', '1.2.x', 'foo']) {
    const result = validateVersion(bad);
    assert.equal(result.ok, false, `expected ${JSON.stringify(bad)} to be rejected`);
    assert.match(result.error, /semver/i);
  }
});

test('validateVersion strips a leading v', () => {
  // Common user mistake: typing "v0.2.0" instead of "0.2.0".
  // Strip rather than reject — friendlier UX.
  assert.deepEqual(validateVersion('v1.2.3'), { ok: true, version: '1.2.3' });
});
