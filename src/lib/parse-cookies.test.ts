import { describe, it, expect } from 'vitest';
import { parseSetCookie } from './parse-cookies';

/**
 * Set-Cookie response-header parsing for the response-panel Cookies tab.
 *
 * Browsers don't expose `set-cookie` to JS (it's a forbidden response
 * header per the Fetch spec — the browser's cookie jar handles it
 * internally). Tauri's HTTP plugin DOES expose it. So this parser only
 * actually fires for Tauri responses, but the Cookies tab needs an
 * honest empty-state in browser-mode either way (instead of the previous
 * always-empty hardcoded view).
 *
 * Format follows RFC 6265 §4.1.1 — `name=value` followed by
 * `; attribute` pairs (case-insensitive attribute names).
 */
describe('parseSetCookie', () => {
  it('parses a simple name=value cookie', () => {
    const cookies = parseSetCookie('sessionId=abc123');
    expect(cookies).toHaveLength(1);
    expect(cookies[0]).toMatchObject({ name: 'sessionId', value: 'abc123' });
  });

  it('parses cookie with attributes (Path, Domain, Max-Age)', () => {
    const cookies = parseSetCookie('id=42; Path=/; Domain=example.com; Max-Age=3600');
    expect(cookies[0]).toMatchObject({
      name: 'id',
      value: '42',
      path: '/',
      domain: 'example.com',
      maxAge: 3600,
    });
  });

  it('parses HttpOnly + Secure flags as booleans', () => {
    const cookies = parseSetCookie('token=xyz; HttpOnly; Secure');
    expect(cookies[0]).toMatchObject({
      name: 'token',
      value: 'xyz',
      httpOnly: true,
      secure: true,
    });
  });

  it('parses SameSite as a string', () => {
    const cookies = parseSetCookie('csrf=q1; SameSite=Strict');
    expect(cookies[0]).toMatchObject({ name: 'csrf', sameSite: 'Strict' });
  });

  it('parses Expires as an ISO string when valid', () => {
    const cookies = parseSetCookie('foo=bar; Expires=Wed, 09 Jun 2026 10:18:14 GMT');
    expect(cookies[0]?.expires).toBe('2026-06-09T10:18:14.000Z');
  });

  it('returns the original Expires text when Date.parse fails', () => {
    const cookies = parseSetCookie('foo=bar; Expires=not-a-real-date');
    expect(cookies[0]?.expires).toBe('not-a-real-date');
  });

  it('handles a value containing "=" (everything after the first "=" is value)', () => {
    const cookies = parseSetCookie('jwt=eyJhbGci=base64==');
    expect(cookies[0]?.value).toBe('eyJhbGci=base64==');
  });

  it('parses multiple cookies separated by newlines (Tauri concatenates this way)', () => {
    const cookies = parseSetCookie('a=1; Path=/\nb=2; Path=/foo');
    expect(cookies).toHaveLength(2);
    expect(cookies[0]).toMatchObject({ name: 'a', value: '1', path: '/' });
    expect(cookies[1]).toMatchObject({ name: 'b', value: '2', path: '/foo' });
  });

  it('parses comma-separated cookies but preserves "Expires" comma in dates', () => {
    // Real Set-Cookie chains can be: `a=1; Expires=Wed, 09 Jun 2026 ..., b=2`
    // The comma INSIDE the date must not split the cookie; only commas
    // after a closing `;` start a new cookie.
    const cookies = parseSetCookie(
      'a=1; Expires=Wed, 09 Jun 2026 10:18:14 GMT, b=2; Path=/',
    );
    expect(cookies).toHaveLength(2);
    expect(cookies[0]?.name).toBe('a');
    expect(cookies[0]?.expires).toBe('2026-06-09T10:18:14.000Z');
    expect(cookies[1]).toMatchObject({ name: 'b', value: '2', path: '/' });
  });

  it('returns [] for empty / whitespace input', () => {
    expect(parseSetCookie('')).toEqual([]);
    expect(parseSetCookie('   ')).toEqual([]);
  });

  it('skips malformed entries (no "=" in name=value position)', () => {
    const cookies = parseSetCookie('justaword');
    expect(cookies).toEqual([]);
  });

  it('treats attribute names case-insensitively', () => {
    const cookies = parseSetCookie('x=y; pATh=/api; secure; httponly');
    expect(cookies[0]).toMatchObject({
      path: '/api',
      secure: true,
      httpOnly: true,
    });
  });
});
