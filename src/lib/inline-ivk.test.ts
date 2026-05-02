import { describe, it, expect } from 'vitest';
import { resolveInlineIvk } from './inline-ivk';

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
