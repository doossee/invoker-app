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

test('rewriteCargoToml handles [package.metadata.*] sub-tables before version', () => {
  const before = `[package]
name = "app"

[package.metadata.bundle]
identifier = "com.example.app"

version = "0.1.0"

[dependencies]
serde = "1.0"
`;
  const after = rewriteCargoToml(before, '0.2.0');
  // Version updated.
  assert.match(after, /^version = "0\.2\.0"$/m);
  // Sub-table preserved.
  assert.match(after, /\[package\.metadata\.bundle\]/);
  // Dependency untouched.
  assert.match(after, /serde = "1\.0"/);
});

import { runRelease } from './release.mjs';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

function makeFixture() {
  const dir = mkdtempSync(join(tmpdir(), 'release-test-'));
  writeFileSync(join(dir, 'package.json'),
    '{\n  "name": "x",\n  "version": "0.1.0"\n}\n');
  writeFileSync(join(dir, 'tauri.conf.json'),
    '{\n  "productName": "Invoker",\n  "version": "0.1.0"\n}\n');
  writeFileSync(join(dir, 'Cargo.toml'),
    '[package]\nname = "app"\nversion = "0.1.0"\nedition = "2021"\n');
  return dir;
}

test('runRelease rewrites all three files', async () => {
  const dir = makeFixture();
  const calls = [];
  await runRelease({
    version: '0.2.0',
    cwd: dir,
    runner: async (cmd, args) => {
      calls.push([cmd, args.join(' ')]);
      // Pretend git status is clean and we're on main.
      if (cmd === 'git' && args[0] === 'status') return { code: 0, stdout: '', stderr: '' };
      if (cmd === 'git' && args.join(' ') === 'rev-parse --abbrev-ref HEAD') return { code: 0, stdout: 'main\n', stderr: '' };
      // Tag does not yet exist.
      if (cmd === 'git' && args[0] === 'rev-parse' && args[1] === '-q' && args[2] === '--verify') return { code: 1, stdout: '', stderr: '' };
      return { code: 0, stdout: '', stderr: '' };
    },
    paths: {
      packageJson: join(dir, 'package.json'),
      tauriConf: join(dir, 'tauri.conf.json'),
      cargoToml: join(dir, 'Cargo.toml'),
    },
  });
  assert.match(readFileSync(join(dir, 'package.json'), 'utf8'), /"version":\s*"0\.2\.0"/);
  assert.match(readFileSync(join(dir, 'tauri.conf.json'), 'utf8'), /"version":\s*"0\.2\.0"/);
  assert.match(readFileSync(join(dir, 'Cargo.toml'), 'utf8'), /^version = "0\.2\.0"$/m);
});

test('runRelease refuses if working tree is dirty', async () => {
  const dir = makeFixture();
  const runner = async (cmd, args) => {
    if (cmd === 'git' && args[0] === 'status') return { code: 0, stdout: ' M package.json\n', stderr: '' };
    return { code: 0, stdout: '', stderr: '' };
  };
  await assert.rejects(
    runRelease({ version: '0.2.0', cwd: dir, runner, paths: {
      packageJson: join(dir, 'package.json'),
      tauriConf: join(dir, 'tauri.conf.json'),
      cargoToml: join(dir, 'Cargo.toml'),
    }}),
    /dirty/i,
  );
});

test('runRelease refuses if not on main branch', async () => {
  const dir = makeFixture();
  const runner = async (cmd, args) => {
    if (cmd === 'git' && args[0] === 'status') return { code: 0, stdout: '', stderr: '' };
    if (cmd === 'git' && args.join(' ') === 'rev-parse --abbrev-ref HEAD') return { code: 0, stdout: 'feature/x\n', stderr: '' };
    return { code: 0, stdout: '', stderr: '' };
  };
  await assert.rejects(
    runRelease({ version: '0.2.0', cwd: dir, runner, paths: {
      packageJson: join(dir, 'package.json'),
      tauriConf: join(dir, 'tauri.conf.json'),
      cargoToml: join(dir, 'Cargo.toml'),
    }}),
    /branch/i,
  );
});

test('runRelease refuses if tag already exists', async () => {
  const dir = makeFixture();
  const runner = async (cmd, args) => {
    if (cmd === 'git' && args[0] === 'status') return { code: 0, stdout: '', stderr: '' };
    if (cmd === 'git' && args.join(' ') === 'rev-parse --abbrev-ref HEAD') return { code: 0, stdout: 'main\n', stderr: '' };
    // Tag exists (rev-parse exits 0).
    if (cmd === 'git' && args[0] === 'rev-parse' && args[1] === '-q' && args[2] === '--verify') return { code: 0, stdout: 'abc1234\n', stderr: '' };
    return { code: 0, stdout: '', stderr: '' };
  };
  await assert.rejects(
    runRelease({ version: '0.2.0', cwd: dir, runner, paths: {
      packageJson: join(dir, 'package.json'),
      tauriConf: join(dir, 'tauri.conf.json'),
      cargoToml: join(dir, 'Cargo.toml'),
    }}),
    /tag.*exists/i,
  );
});

test('runRelease invokes git add, commit, tag in order', async () => {
  const dir = makeFixture();
  const calls = [];
  const runner = async (cmd, args) => {
    calls.push(`${cmd} ${args.join(' ')}`);
    if (cmd === 'git' && args[0] === 'status') return { code: 0, stdout: '', stderr: '' };
    if (cmd === 'git' && args.join(' ') === 'rev-parse --abbrev-ref HEAD') return { code: 0, stdout: 'main\n', stderr: '' };
    if (cmd === 'git' && args[0] === 'rev-parse' && args[1] === '-q' && args[2] === '--verify') return { code: 1, stdout: '', stderr: '' };
    return { code: 0, stdout: '', stderr: '' };
  };
  await runRelease({ version: '0.2.0', cwd: dir, runner, paths: {
    packageJson: join(dir, 'package.json'),
    tauriConf: join(dir, 'tauri.conf.json'),
    cargoToml: join(dir, 'Cargo.toml'),
  }});
  // Find the indices of the key operations to assert ordering.
  const addIdx = calls.findIndex(c => c.startsWith('git add'));
  const commitIdx = calls.findIndex(c => c.startsWith('git commit'));
  const tagIdx = calls.findIndex(c => c.startsWith('git tag'));
  assert.ok(addIdx >= 0 && commitIdx > addIdx && tagIdx > commitIdx,
    `expected add → commit → tag, got: ${calls.join('\n')}`);
});
