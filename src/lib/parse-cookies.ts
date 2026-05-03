/**
 * Set-Cookie response-header parsing for the Cookies tab in
 * `ResponsePanel`. Pre-existing `CookiesView` was always-empty —
 * never received the response — so any `set-cookie` from a Tauri
 * response was invisible. This util plus the prop-wiring fix it.
 *
 * Browsers DO NOT expose `set-cookie` to JS — it's a forbidden response
 * header per the Fetch spec. So this parser only fires for Tauri
 * responses (and any future transport that surfaces it). Browser-mode
 * still benefits from the new wiring because the empty state can now
 * be honest about WHY there are no cookies.
 *
 * Format: RFC 6265 §4.1.1.
 */
export interface ParsedCookie {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  /** Seconds. Set-Cookie spec defines as integer. */
  maxAge?: number;
  /** ISO 8601 string when the source `Expires` parses as a Date,
   *  otherwise the original raw text so users can still see it. */
  expires?: string;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: string;
}

/**
 * Split a Set-Cookie blob into individual cookies.
 *
 * Tauri's HTTP plugin concatenates multiple Set-Cookie headers with
 * `\n`; some servers / proxies join with `, ` instead. Splitting on
 * comma is tricky because `Expires=Wed, 09 Jun ...` contains a comma
 * inside a single cookie's value. The rule: a `, ` that follows
 * `name=value` separators (no `;` since the previous comma) starts a
 * new cookie; a `, ` inside the date value (right after `Expires=` or
 * after a weekday name) does not.
 *
 * Heuristic: split on `, ` only when the next non-whitespace character
 * is followed by `=` (i.e. it looks like the start of a new
 * `name=value`). Cookie names per RFC are token characters
 * (alphanumerics + a few symbols), no spaces, so the lookahead is
 * stable.
 */
function splitCookies(raw: string): string[] {
  // Always split on newline first — that's the unambiguous separator.
  const lines = raw.split(/\r?\n/);
  const out: string[] = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    // Walk and split on `, ` where the right side starts a new cookie.
    let cur = '';
    let i = 0;
    while (i < line.length) {
      const ch = line[i]!;
      if (ch === ',' && line[i + 1] === ' ') {
        // Look ahead: is the next non-space chunk a new cookie name?
        // A new cookie looks like `name=...` where name is token chars.
        const rest = line.slice(i + 2);
        const m = /^([A-Za-z0-9!#$%&'*+\-.^_`|~]+)=/.exec(rest);
        if (m) {
          out.push(cur);
          cur = '';
          i += 2; // skip ", "
          continue;
        }
      }
      cur += ch;
      i++;
    }
    if (cur.trim()) out.push(cur);
  }
  return out;
}

export function parseSetCookie(raw: string): ParsedCookie[] {
  if (!raw || !raw.trim()) return [];
  return splitCookies(raw)
    .map((entry): ParsedCookie | null => {
      const parts = entry.split(';').map((p) => p.trim()).filter(Boolean);
      if (parts.length === 0) return null;
      const first = parts[0]!;
      const eq = first.indexOf('=');
      if (eq <= 0) return null; // malformed (no name= or empty name)
      const name = first.slice(0, eq).trim();
      const value = first.slice(eq + 1);
      const out: ParsedCookie = { name, value };
      for (const part of parts.slice(1)) {
        const eqAttr = part.indexOf('=');
        const attrName = (eqAttr === -1 ? part : part.slice(0, eqAttr)).trim().toLowerCase();
        const attrValue = eqAttr === -1 ? '' : part.slice(eqAttr + 1).trim();
        switch (attrName) {
          case 'path':
            out.path = attrValue;
            break;
          case 'domain':
            out.domain = attrValue;
            break;
          case 'max-age': {
            const n = parseInt(attrValue, 10);
            if (!Number.isNaN(n)) out.maxAge = n;
            break;
          }
          case 'expires': {
            const d = Date.parse(attrValue);
            out.expires = Number.isNaN(d) ? attrValue : new Date(d).toISOString();
            break;
          }
          case 'httponly':
            out.httpOnly = true;
            break;
          case 'secure':
            out.secure = true;
            break;
          case 'samesite':
            out.sameSite = attrValue;
            break;
        }
      }
      return out;
    })
    .filter((c): c is ParsedCookie => c !== null);
}
