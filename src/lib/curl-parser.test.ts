import { describe, it, expect } from 'vitest';
import { parseCurl } from './curl-parser';

/**
 * cURL command parser. Handles the 80% case so users can paste a snippet
 * from MDN / Stripe docs / a sniffer and get a valid request — instead of
 * having to manually transcribe each `-H` and `-d` flag.
 *
 * Supported flags (long + short forms):
 *   -X / --request <METHOD>
 *   -H / --header  "Key: Value"      (repeatable)
 *   -d / --data <body>
 *        --data-raw <body>
 *        --data-binary <body>
 *        --data-urlencode <body>
 *   -u / --user <user:pass>          (translated to Authorization: Basic …)
 *
 * Out of scope (returned as plain "best-effort" — body filled with noise
 * the user can clean up — but we don't crash):
 *   --form / -F (multipart), file uploads, --upload-file, cookies (--cookie),
 *   --resolve, custom proxies, etc.
 *
 * Returns `null` when the input doesn't look like a curl command at all
 * (no leading `curl ` token), so the URL bar can fall back to treating
 * the value as a plain URL.
 */
describe('parseCurl', () => {
  it('returns null for non-curl input', () => {
    expect(parseCurl('https://example.com')).toBeNull();
    expect(parseCurl('GET https://example.com')).toBeNull();
    expect(parseCurl('')).toBeNull();
    expect(parseCurl('   ')).toBeNull();
  });

  it('parses bare URL: `curl https://example.com` → GET, no headers, no body', () => {
    const r = parseCurl('curl https://example.com');
    expect(r).not.toBeNull();
    expect(r!.method).toBe('GET');
    expect(r!.url).toBe('https://example.com');
    expect(r!.headers).toEqual({});
    expect(r!.body).toBe('');
  });

  it('parses -X / --request method', () => {
    expect(parseCurl('curl -X POST https://api.example.com/users')!.method).toBe('POST');
    expect(parseCurl('curl --request DELETE https://api.example.com/u/1')!.method).toBe('DELETE');
  });

  it('parses single -H / --header', () => {
    const r = parseCurl(`curl -H "Accept: application/json" https://api.example.com`);
    expect(r!.headers).toEqual({ Accept: 'application/json' });
  });

  it('parses multiple repeated -H flags', () => {
    const r = parseCurl(
      `curl -H "Accept: application/json" -H "X-Trace: tr-1" https://api.example.com`,
    );
    expect(r!.headers).toEqual({
      Accept: 'application/json',
      'X-Trace': 'tr-1',
    });
  });

  it('parses -d body and infers POST when method is unspecified', () => {
    // Real curl does the same — `-d` without `-X` upgrades to POST.
    const r = parseCurl(`curl -d '{"hello":"world"}' https://api.example.com/echo`);
    expect(r!.method).toBe('POST');
    expect(r!.body).toBe('{"hello":"world"}');
  });

  it('preserves explicit -X when -d is also present', () => {
    const r = parseCurl(`curl -X PUT -d 'replace me' https://api.example.com/u/1`);
    expect(r!.method).toBe('PUT');
    expect(r!.body).toBe('replace me');
  });

  it('parses --data, --data-raw, --data-binary, --data-urlencode equivalently for body capture', () => {
    expect(parseCurl(`curl --data 'a' https://x`)!.body).toBe('a');
    expect(parseCurl(`curl --data-raw 'b' https://x`)!.body).toBe('b');
    expect(parseCurl(`curl --data-binary 'c' https://x`)!.body).toBe('c');
    expect(parseCurl(`curl --data-urlencode 'd' https://x`)!.body).toBe('d');
  });

  it('parses -u / --user → Authorization: Basic <base64>', () => {
    const r = parseCurl(`curl -u alice:s3cr3t https://api.example.com`);
    // base64("alice:s3cr3t") = "YWxpY2U6czNjcjN0"
    expect(r!.headers.Authorization).toBe('Basic YWxpY2U6czNjcjN0');
  });

  it('handles the realistic Stripe-style example end-to-end', () => {
    const input = `curl https://api.stripe.com/v1/customers \\
      -u sk_test_xyz: \\
      -H "Stripe-Version: 2024-01-01" \\
      -d email=test@example.com \\
      -d "name=Test User"`;
    const r = parseCurl(input);
    expect(r!.method).toBe('POST'); // -d implied
    expect(r!.url).toBe('https://api.stripe.com/v1/customers');
    expect(r!.headers['Stripe-Version']).toBe('2024-01-01');
    expect(r!.headers.Authorization).toMatch(/^Basic /);
    // Multiple -d flags should concatenate with `&` like real curl.
    expect(r!.body).toBe('email=test@example.com&name=Test User');
  });

  it('strips $ prompt and leading whitespace', () => {
    expect(parseCurl('  $ curl https://example.com')!.url).toBe('https://example.com');
    expect(parseCurl('$curl https://example.com')!.url).toBe('https://example.com');
  });

  it('handles single-quoted URL', () => {
    expect(parseCurl(`curl 'https://example.com/with spaces'`)!.url).toBe(
      'https://example.com/with spaces',
    );
  });
});
