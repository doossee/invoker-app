import { describe, it, expect } from 'vitest';
import { resolveInlineIvk, openTabSpecForInline } from './inline-ivk';

const files = [
  { path: 'core-service/translation/get-by-key.ivk', name: 'get-by-key', content: 'POST {{baseUrl}}/api\nContent-Type: application/json\n\n{"jsonrpc":"2.0"}' },
  { path: 'auth/login.ivk', name: 'login', content: 'POST {{baseUrl}}/login' },
];

describe('resolveInlineIvk', () => {
  it('treats raw .ivk content as direct source', () => {
    const result = resolveInlineIvk('GET https://api.example.com/users', files);
    expect(result.ok).toBe(true);
    expect(result.ok && result.content).toBe('GET https://api.example.com/users');
    expect(result.ok && result.sourcePath).toBeUndefined();
  });

  it('preserves multi-line raw content (full ivk file inline)', () => {
    const inline = 'POST {{baseUrl}}/users\nContent-Type: application/json\n\n{"name":"x"}';
    const result = resolveInlineIvk(inline, files);
    expect(result.ok && result.content).toBe(inline);
  });

  it('resolves path: reference to the file content from the collection', () => {
    const result = resolveInlineIvk('path: core-service/translation/get-by-key.ivk', files);
    expect(result.ok).toBe(true);
    expect(result.ok && result.content).toBe(files[0].content);
    expect(result.ok && result.sourcePath).toBe('core-service/translation/get-by-key.ivk');
  });

  it('tolerates extra whitespace around path: syntax', () => {
    const result = resolveInlineIvk('   path:   auth/login.ivk   ', files);
    expect(result.ok && result.content).toBe(files[1].content);
  });

  it('returns ok:false when path: target is not in the collection', () => {
    const result = resolveInlineIvk('path: missing/nope.ivk', files);
    expect(result.ok).toBe(false);
    expect(!result.ok && result.error).toMatch(/not found/i);
    expect(!result.ok && result.error).toContain('missing/nope.ivk');
  });

  it('does not treat content with embedded "path:" lower in the body as a path reference', () => {
    // A real ivk file might contain a body that mentions the word "path:" —
    // only the FIRST line opening with "path:" indicates a reference.
    const inline = 'POST {{baseUrl}}/x\n\n{ "path": "/some/api/path" }';
    const result = resolveInlineIvk(inline, files);
    expect(result.ok && result.content).toBe(inline);
    expect(result.ok && result.sourcePath).toBeUndefined();
  });

  it('handles path: with leading whitespace on the reference line itself', () => {
    // Markdown sometimes preserves indentation. As long as the FIRST non-empty
    // line is a `path:` reference, treat it as one.
    const result = resolveInlineIvk('  path: auth/login.ivk', files);
    expect(result.ok && result.content).toBe(files[1].content);
  });

  it('returns ok:false (not silently fallthrough) on a path: reference to a non-.ivk file', () => {
    const result = resolveInlineIvk('path: README.md', files);
    expect(result.ok).toBe(false);
    expect(!result.ok && result.error).toMatch(/\.ivk/i);
  });
});

describe('openTabSpecForInline', () => {
  it('uses sourcePath as the tab path for path: reference blocks', () => {
    // The user-visible bug: clicking Open on a path-reference block created
    // a tab with `inline-${Date.now()}` as the path, which RequestEditor
    // couldn't load → "Could not parse request file." Now we hand back the
    // real collection path, which DOES load.
    const resolved = resolveInlineIvk(
      'path: core-service/translation/get-by-key.ivk',
      files,
    );
    const spec = openTabSpecForInline(resolved, '{{baseUrl}}/api');
    expect(spec.path).toBe('core-service/translation/get-by-key.ivk');
    expect(spec.name).toBe('get-by-key');
    expect(spec.openable).toBe(true);
  });

  it('handles a path: reference at the collection root (no slash)', () => {
    const localFiles = [
      { path: 'login.ivk', name: 'login', content: 'POST /x' },
    ];
    const resolved = resolveInlineIvk('path: login.ivk', localFiles);
    const spec = openTabSpecForInline(resolved, 'POST /x');
    expect(spec.path).toBe('login.ivk');
    expect(spec.name).toBe('login');
    expect(spec.openable).toBe(true);
  });

  it('marks direct-content blocks as not openable (no real file in collection)', () => {
    // A direct-content block isn't backed by a file in the collection — there's
    // nothing for RequestEditor to load. Caller should hide the Open button.
    const resolved = resolveInlineIvk('GET https://api.example.com/users', files);
    const spec = openTabSpecForInline(resolved, 'https://api.example.com/users');
    expect(spec.openable).toBe(false);
    expect(spec.path).toMatch(/^inline-/); // synthetic, won't resolve
    expect(spec.name).toBe('users'); // last URL segment
  });

  it('falls back to "request" when URL has no usable last segment (empty / trailing slash)', () => {
    const resolved = resolveInlineIvk('GET /', files);
    expect(openTabSpecForInline(resolved, '').name).toBe('request');
    expect(openTabSpecForInline(resolved, '/').name).toBe('request');
    expect(openTabSpecForInline(resolved, 'https://api.example.com/').name).toBe('request');
  });

  it('uses the injectable now() so the synthetic path is testable', () => {
    const resolved = resolveInlineIvk('GET /x', files);
    const spec = openTabSpecForInline(resolved, '/x', () => 1234567890);
    expect(spec.path).toBe('inline-1234567890');
  });

  it('marks failed-resolution blocks (e.g. unknown path:) as not openable', () => {
    const resolved = resolveInlineIvk('path: missing/nope.ivk', files);
    const spec = openTabSpecForInline(resolved, '');
    expect(spec.openable).toBe(false);
    // The error tile renders before the Open button is even shown, but the
    // spec is still total so callers don't need to special-case the error
    // branch when constructing fallback tab metadata.
    expect(spec.path).toMatch(/^inline-/);
  });
});
