/**
 * Resolve the source content for an inline ```ivk``` code block in markdown.
 *
 * Two valid forms:
 *
 *   1. Full inline source — the block contains a normal .ivk request:
 *
 *        ```ivk
 *        GET {{baseUrl}}/users
 *        Accept: application/json
 *        ```
 *
 *   2. Path reference — the block points to an existing .ivk file in the
 *      current collection. Useful in folder README.md docs to embed a
 *      runnable preview of an endpoint without duplicating its source:
 *
 *        ```ivk
 *        path: core-service/translation/get-by-key.ivk
 *        ```
 *
 * Until this fix, the second form silently parsed as garbage (`parseIvk`
 * couldn't make sense of the `path: ...` line, the catch swallowed the
 * error, and the block rendered as "GET / No body" with an empty URL).
 */

interface CollectionFile {
  path: string;
  content: string;
}

export type ResolveResult =
  | { ok: true; content: string; sourcePath?: string }
  | { ok: false; error: string };

export interface InlineOpenSpec {
  /** Path to use for the new tab. For path-references this is the real
   *  collection path; for direct-content blocks it's an `inline-*` synthetic
   *  path (which currently won't resolve to a real file — see openable). */
  path: string;
  /** Display name for the tab. */
  name: string;
  /** Whether the spec maps to a real file in the collection. The Open
   *  button should only be shown when this is true; opening a synthetic
   *  inline path lands the user on "Could not parse request file." */
  openable: boolean;
}

const PATH_REF_RE = /^\s*path:\s*(\S+)\s*$/;

/**
 * @param blockContent  raw text inside the ```ivk``` fence
 * @param files         the collection's .ivk files (used to look up a path: target)
 */
export function resolveInlineIvk(
  blockContent: string,
  files: ReadonlyArray<CollectionFile>,
): ResolveResult {
  // Only treat the FIRST non-empty line as a possible path: reference.
  // This avoids false positives when an ivk body contains the word "path:"
  // (e.g. a JSON payload with a "path" field).
  const firstLine = blockContent.split(/\r?\n/).find((l) => l.trim().length > 0) ?? '';
  const match = PATH_REF_RE.exec(firstLine);
  const totalLines = blockContent.split(/\r?\n/).filter((l) => l.trim().length > 0).length;

  // Only counts as a path reference if it's the ONLY meaningful line.
  if (match && totalLines === 1) {
    const refPath = match[1];
    if (!refPath.endsWith('.ivk')) {
      return { ok: false, error: `path: target must be a .ivk file (got ${refPath})` };
    }
    const found = files.find((f) => f.path === refPath);
    if (!found) {
      return { ok: false, error: `referenced file not found in collection: ${refPath}` };
    }
    return { ok: true, content: found.content, sourcePath: refPath };
  }

  // Otherwise treat the block as a literal .ivk source.
  return { ok: true, content: blockContent };
}

/**
 * Spec for the "Open" button on an inline ivk block — converts a resolved
 * block plus its parsed URL into the tab arguments to feed openTab().
 *
 * Path-reference blocks → open the actual file (sourcePath, openable=true).
 * Direct-content blocks → there is no real file in the collection to open,
 *   so we mark openable=false and let the caller hide the Open button.
 *   Returning a spec anyway (with a synthetic inline-* path) keeps the
 *   helper total: callers can still use the name/path for fallback UI.
 */
export function openTabSpecForInline(
  resolved: ResolveResult,
  url: string,
  now: () => number = Date.now,
): InlineOpenSpec {
  if (resolved.ok && resolved.sourcePath) {
    const filename = resolved.sourcePath.split('/').pop() ?? 'request';
    const name = filename.replace(/\.ivk$/, '');
    return { path: resolved.sourcePath, name, openable: true };
  }
  // Direct content has no backing file; the caller should not render Open.
  const name = url.split('/').pop() || 'request';
  return { path: `inline-${now()}`, name, openable: false };
}
