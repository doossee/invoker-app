import type { Plugin } from 'unified';
import type { Root, Text, Link, RootContent } from 'mdast';
import { parseWikilinks } from './wikilinks';

/**
 * Remark plugin that rewrites Obsidian-style `[[wikilink]]` text
 * fragments into proper markdown link nodes. Runs after remark-gfm
 * and before any rehype passes, so the resulting `<a>` elements get
 * styled exactly like other links.
 *
 * In-page anchor links (`[[#Heading]]`) become `<a href="#slug">`.
 * The corresponding heading IDs are added by the custom `h1`-`h6`
 * components in `MarkdownDocView` so the browser can scroll on click.
 *
 * Cross-doc links emit `<a href="invoker:doc/<target>">` which the
 * `<a>` component override in `MarkdownDocView` intercepts and routes
 * via the editor-store.
 */
export const remarkWikilinks: Plugin<[], Root> = () => {
  return (tree) => {
    visitTextNodes(tree, (textNode, index, parent) => {
      const segments = parseWikilinks(textNode.value);
      // No wikilinks found — leave the node alone (no-op fast path).
      if (segments.length === 1 && segments[0]?.kind === 'text') return;
      // No detected wikilinks at all (parser returned only the
      // original text) — also a no-op.
      if (!segments.some((s) => s.kind === 'link')) return;

      const replacements: RootContent[] = segments.map((seg) => {
        if (seg.kind === 'text') {
          const t: Text = { type: 'text', value: seg.value };
          return t;
        }
        const link: Link = {
          type: 'link',
          url: seg.isCrossDoc ? `invoker:doc/${seg.target}` : seg.target,
          children: [{ type: 'text', value: seg.label }],
        };
        return link;
      });

      // Splice the replacements into the parent's children at this index.
      parent.children.splice(index, 1, ...replacements);
    });
  };
};

/**
 * Walk every `text` node in the mdast and call `visitor` for each.
 * The visitor receives (node, index, parent) so it can mutate parent
 * in place. Iteration is reverse-order to keep indices valid through
 * splice operations within the same parent.
 *
 * Skips `code`, `inlineCode`, `html`, and `link` subtrees — wikilinks
 * inside those should stay literal (they're code samples or already
 * proper links).
 */
function visitTextNodes(
  tree: Root,
  visitor: (
    node: Text,
    index: number,
    parent: { children: RootContent[] },
  ) => void,
) {
  function walk(node: { type: string; children?: RootContent[] }) {
    if (
      node.type === 'code' ||
      node.type === 'inlineCode' ||
      node.type === 'html' ||
      node.type === 'link'
    ) {
      return;
    }
    if (!Array.isArray(node.children)) return;
    for (let i = node.children.length - 1; i >= 0; i--) {
      const child = node.children[i]!;
      if (child.type === 'text') {
        visitor(
          child as Text,
          i,
          node as { children: RootContent[] },
        );
      } else {
        walk(child as { type: string; children?: RootContent[] });
      }
    }
  }
  walk(tree);
};
