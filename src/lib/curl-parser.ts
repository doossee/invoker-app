/**
 * Tiny shell-aware tokenizer + curl flag walker. Designed to handle the
 * 80% of curl commands a developer will paste from MDN / Stripe docs /
 * a network sniffer. Not a full POSIX shell parser.
 *
 * See `curl-parser.test.ts` for the supported flag surface.
 *
 * Returns null when input doesn't look like a curl command — the URL bar
 * caller falls back to treating the value as a plain URL.
 */

export interface ParsedCurl {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string;
}

const TAKES_VALUE = new Set([
  '-X',
  '--request',
  '-H',
  '--header',
  '-d',
  '--data',
  '--data-raw',
  '--data-binary',
  '--data-urlencode',
  '-u',
  '--user',
]);

const DATA_FLAGS = new Set([
  '-d',
  '--data',
  '--data-raw',
  '--data-binary',
  '--data-urlencode',
]);

export function parseCurl(input: string): ParsedCurl | null {
  if (!input) return null;

  // Strip leading whitespace + optional shell prompt.
  let s = input.replace(/^\s*\$\s*/, '').trimStart();
  if (!/^curl(\s|$)/.test(s)) return null;

  // Drop the leading "curl" token.
  s = s.replace(/^curl\s*/, '');

  // Replace line continuations (`\` at end of line) with a single space so
  // multi-line pasted commands tokenize correctly.
  s = s.replace(/\\\r?\n/g, ' ');

  const tokens = tokenize(s);

  let method: string | null = null;
  let url = '';
  const headers: Record<string, string> = {};
  const dataParts: string[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i]!;
    if (TAKES_VALUE.has(tok)) {
      const val = tokens[i + 1] ?? '';
      i++;
      if (tok === '-X' || tok === '--request') {
        method = val.toUpperCase();
      } else if (tok === '-H' || tok === '--header') {
        const sep = val.indexOf(':');
        if (sep > 0) {
          const key = val.slice(0, sep).trim();
          const value = val.slice(sep + 1).trim();
          if (key) headers[key] = value;
        }
      } else if (DATA_FLAGS.has(tok)) {
        dataParts.push(val);
      } else if (tok === '-u' || tok === '--user') {
        // -u user:pass  →  Authorization: Basic base64(user:pass)
        // Stripe-style "-u sk_test_xyz:" sends a colon-terminated value.
        headers.Authorization = `Basic ${base64(val)}`;
      }
      continue;
    }

    // Other -<flag> we don't model — skip (and skip its value if it looks
    // like one). Bare URL is the most common positional arg.
    if (tok.startsWith('-')) {
      // Don't consume a value we don't know how to interpret. If the next
      // token also starts with `-` or looks URL-y, leave it for the loop.
      continue;
    }

    if (!url) {
      url = tok;
    }
  }

  // -d implies POST when no explicit method was passed (real curl behaviour).
  if (method === null) {
    method = dataParts.length > 0 ? 'POST' : 'GET';
  }

  return {
    method,
    url,
    headers,
    body: dataParts.join('&'),
  };
}

/**
 * Quote-aware tokenizer. Recognises:
 *   - single-quoted strings: '...'  (no escape processing inside)
 *   - double-quoted strings: "..."  (preserves backslash-escapes for " and \)
 *   - bare tokens split on whitespace
 *
 * Limitations: no `$VAR` expansion, no command substitution, no `${VAR:-x}`.
 * That's fine — pasted curl commands rarely contain shell variables.
 */
function tokenize(input: string): string[] {
  const out: string[] = [];
  let i = 0;
  const n = input.length;
  while (i < n) {
    const c = input[i]!;
    if (c === ' ' || c === '\t' || c === '\n' || c === '\r') {
      i++;
      continue;
    }
    if (c === "'") {
      // Single-quoted: read until next single quote, no escapes.
      const end = input.indexOf("'", i + 1);
      if (end === -1) {
        out.push(input.slice(i + 1));
        return out;
      }
      out.push(input.slice(i + 1, end));
      i = end + 1;
      continue;
    }
    if (c === '"') {
      // Double-quoted: read until next unescaped double quote.
      let buf = '';
      let j = i + 1;
      while (j < n) {
        const ch = input[j]!;
        if (ch === '\\' && j + 1 < n) {
          const next = input[j + 1]!;
          if (next === '"' || next === '\\') {
            buf += next;
            j += 2;
            continue;
          }
        }
        if (ch === '"') break;
        buf += ch;
        j++;
      }
      out.push(buf);
      i = j + 1;
      continue;
    }
    // Bare token: read until whitespace or quote
    let j = i;
    let buf = '';
    while (j < n) {
      const ch = input[j]!;
      if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r' || ch === "'" || ch === '"') break;
      if (ch === '\\' && j + 1 < n) {
        // Backslash escapes the next character (drop the backslash).
        buf += input[j + 1];
        j += 2;
        continue;
      }
      buf += ch;
      j++;
    }
    out.push(buf);
    i = j;
  }
  return out;
}

function base64(s: string): string {
  // btoa is available in browsers and Node ≥16, which covers every env
  // invoker-app runs in (browser-demo, Tauri webview, Node-based vitest).
  // Credentials are typically ASCII so we don't need the TextEncoder
  // roundtrip for non-ASCII safety here.
  return btoa(s);
}
