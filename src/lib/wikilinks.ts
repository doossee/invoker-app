/**
 * Obsidian-style `[[wikilink]]` parser. The user's collections are
 * authored in Obsidian (the parent project of `invoker-app` is
 * `obsidian-invoker`), so the syntax appears extensively in folder
 * READMEs and standalone docs. Standard markdown renders the syntax
 * as literal text — this util plus the remark plugin in
 * `markdown-wikilinks-plugin.ts` rewrites it into proper links.
 *
 * Forms supported:
 *   [[#anchor]]           → in-page anchor link
 *   [[#anchor|alias]]     → in-page link with custom label
 *   [[doc]]               → cross-doc link (target = doc path/basename)
 *   [[doc#anchor]]        → cross-doc link to a heading
 *   [[doc|alias]]         → cross-doc link with alias
 *   [[doc#anchor|alias]]  → all three at once
 *
 * The slug rules below match Obsidian (preserve parens, lowercase,
 * hyphenate spaces) — NOT GitHub-style — so anchors written in
 * Obsidian and synced into Invoker work without re-encoding.
 */

export type WikilinkSegment =
  | { kind: 'text'; value: string }
  | {
      kind: 'link';
      /** href value the link should point to. For in-page anchors:
       *  starts with `#`. For cross-doc: `<doc>` or `<doc>#<anchor>`. */
      target: string;
      /** Display text for the link. */
      label: string;
      /** True when the wikilink targets a heading in the current doc. */
      isAnchor: boolean;
      /** True when the wikilink targets a different doc. */
      isCrossDoc: boolean;
    };

/**
 * Match: `[[ ... ]]` where the inside is anything except `[]` or
 * an unescaped newline. Lazy so multiple links on one line each
 * get their own match.
 */
const WIKILINK_RE = /\[\[([^\[\]\n]+?)\]\]/g;

export function slugifyHeading(raw: string): string {
  return raw
    .toLowerCase()
    // Drop characters Obsidian also strips from anchor slugs:
    // square brackets, hashes (used as the anchor marker itself),
    // backticks, asterisks (formatting markers).
    .replace(/[\[\]#`*]/g, '')
    .trim()
    // Collapse runs of whitespace into a single hyphen.
    .replace(/\s+/g, '-');
}

/**
 * Walk a string and split it into alternating text + link segments.
 * Pure function — the remark plugin (and any other consumer) decides
 * how to render the resulting nodes.
 */
export function parseWikilinks(raw: string): WikilinkSegment[] {
  const segments: WikilinkSegment[] = [];
  let cursor = 0;
  WIKILINK_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = WIKILINK_RE.exec(raw)) !== null) {
    const inner = match[1]!.trim();
    if (inner === '') {
      // `[[]]` — leave as literal text.
      continue;
    }
    // Pre-link text.
    if (match.index > cursor) {
      segments.push({ kind: 'text', value: raw.slice(cursor, match.index) });
    }
    segments.push(parseInnerLink(inner));
    cursor = match.index + match[0].length;
  }
  if (cursor < raw.length) {
    segments.push({ kind: 'text', value: raw.slice(cursor) });
  }
  return segments.length > 0 ? segments : [{ kind: 'text', value: raw }];
}

function parseInnerLink(inner: string): WikilinkSegment {
  // Split off alias: `target|alias`
  const pipeIdx = inner.indexOf('|');
  const targetPart = pipeIdx === -1 ? inner : inner.slice(0, pipeIdx).trim();
  const alias = pipeIdx === -1 ? null : inner.slice(pipeIdx + 1).trim();

  if (targetPart.startsWith('#')) {
    // In-page anchor: `[[#Heading]]` or `[[#Heading|alias]]`
    const anchorText = targetPart.slice(1);
    return {
      kind: 'link',
      target: '#' + slugifyHeading(anchorText),
      label: alias || anchorText,
      isAnchor: true,
      isCrossDoc: false,
    };
  }

  // Cross-doc, possibly with an inline anchor: `Foo` or `Foo#Bar`.
  const hashIdx = targetPart.indexOf('#');
  if (hashIdx === -1) {
    return {
      kind: 'link',
      target: targetPart,
      label: alias || targetPart,
      isAnchor: false,
      isCrossDoc: true,
    };
  }
  const docPart = targetPart.slice(0, hashIdx);
  const anchorPart = targetPart.slice(hashIdx + 1);
  return {
    kind: 'link',
    target: `${docPart}#${slugifyHeading(anchorPart)}`,
    label: alias || `${docPart} > ${anchorPart}`,
    isAnchor: false,
    isCrossDoc: true,
  };
}
