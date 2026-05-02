import test from 'node:test';
import assert from 'node:assert/strict';
import { validateVersion, rewritePackageJson, rewriteTauriConfJson, rewriteCargoToml } from './release.mjs';

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

test('rewritePackageJson updates the version field', () => {
  const before = JSON.stringify({ name: 'invoker-app', version: '0.1.0', private: true }, null, 2);
  const after = rewritePackageJson(before, '0.2.0');
  const parsed = JSON.parse(after);
  assert.equal(parsed.version, '0.2.0');
  assert.equal(parsed.name, 'invoker-app');
  assert.equal(parsed.private, true);
});

test('rewritePackageJson preserves trailing newline if present', () => {
  const before = '{\n  "name": "x",\n  "version": "0.1.0"\n}\n';
  const after = rewritePackageJson(before, '0.2.0');
  assert.ok(after.endsWith('\n'), 'expected trailing newline preserved');
});

test('rewriteTauriConfJson updates the top-level version field', () => {
  const before = JSON.stringify({
    productName: 'Invoker',
    version: '0.1.0',
    build: { frontendDist: '../dist' },
  }, null, 2);
  const after = rewriteTauriConfJson(before, '0.2.0');
  const parsed = JSON.parse(after);
  assert.equal(parsed.version, '0.2.0');
  assert.equal(parsed.productName, 'Invoker');
  assert.equal(parsed.build.frontendDist, '../dist');
});

test('rewriteCargoToml updates only [package] version, not deps', () => {
  const before = `[package]
name = "app"
version = "0.1.0"
edition = "2021"

[dependencies]
serde = { version = "1.0", features = ["derive"] }
tauri = { version = "2.10.3" }
`;
  const after = rewriteCargoToml(before, '0.2.0');
  // [package] version updated.
  assert.match(after, /^\s*\[package\][\s\S]*?^version = "0\.2\.0"$/m);
  // [dependencies] versions untouched.
  assert.match(after, /serde = \{ version = "1\.0"/);
  assert.match(after, /tauri = \{ version = "2\.10\.3"/);
});

test('rewriteCargoToml refuses if there is no [package] version', () => {
  const before = `[dependencies]
serde = { version = "1.0" }
`;
  assert.throws(() => rewriteCargoToml(before, '0.2.0'), /\[package\] version/);
});
