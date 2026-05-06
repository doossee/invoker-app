/**
 * Unit coverage for the Obsidian-style `[[wikilink]]` parser used by
 * the markdown preview.
 *
 * Forms supported (per the user-reported gap — README of a folder
 * containing `[[#Medcard]]`, `[[#Upload (Patient)]]` etc. rendered as
 * literal `[[…]]` text instead of clickable links):
 *
 *   [[#anchor]]           → in-page anchor link
 *   [[#anchor|alias]]     → in-page anchor link with custom display
 *   [[doc]]               → cross-doc link (matched by doc.path or basename)
 *   [[doc#anchor]]        → cross-doc link to a heading
 *   [[doc|alias]]         → cross-doc link with custom display
 *   [[doc#anchor|alias]]  → all three at once
 *
 * The parser is a pure function — the markdown plugin in
 * `markdown-wikilinks-plugin.ts` walks the mdast and feeds text nodes
 * through it. Click handling for cross-doc links lives in
 * `MarkdownDocView`'s component overrides.
 */

import { describe, it, expect } from 'vitest';
import { parseWikilinks, slugifyHeading } from './wikilinks';

describe('slugifyHeading', () => {
  it('lowercases + hyphenates spaces', () => {
    expect(slugifyHeading('Hello World')).toBe('hello-world');
  });

  it('preserves parentheses (Obsidian compat)', () => {
    // Obsidian keeps parens in anchor slugs; GitHub strips them. We
    // match Obsidian since that's the source of the user's docs.
    expect(slugifyHeading('Upload (Patient)')).toBe('upload-(patient)');
  });

  it('strips brackets, hashes, leading/trailing whitespace', () => {
    expect(slugifyHeading('  [Hello] #World  ')).toBe('hello-world');
  });

  it('collapses runs of whitespace into a single hyphen', () => {
    expect(slugifyHeading('a   b\t\nc')).toBe('a-b-c');
  });

  it('returns empty string for empty / whitespace input', () => {
    expect(slugifyHeading('')).toBe('');
    expect(slugifyHeading('   ')).toBe('');
  });
});

describe('parseWikilinks — splits text into segments', () => {
  it('returns the original text when no wikilinks present', () => {
    const result = parseWikilinks('plain markdown text');
    expect(result).toEqual([{ kind: 'text', value: 'plain markdown text' }]);
  });

  it('parses a bare in-page anchor link', () => {
    const result = parseWikilinks('see [[#Medcard]] below');
    expect(result).toEqual([
      { kind: 'text', value: 'see ' },
      { kind: 'link', target: '#medcard', label: 'Medcard', isAnchor: true, isCrossDoc: false },
      { kind: 'text', value: ' below' },
    ]);
  });

  it('parses an in-page anchor with parentheses (Obsidian style)', () => {
    const result = parseWikilinks('[[#Upload (Patient)]]');
    expect(result).toEqual([
      {
        kind: 'link',
        target: '#upload-(patient)',
        label: 'Upload (Patient)',
        isAnchor: true,
        isCrossDoc: false,
      },
    ]);
  });

  it('parses an alias for an anchor link', () => {
    const result = parseWikilinks('[[#Medcard|jump here]]');
    expect(result).toEqual([
      {
        kind: 'link',
        target: '#medcard',
        label: 'jump here',
        isAnchor: true,
        isCrossDoc: false,
      },
    ]);
  });

  it('parses a cross-doc link', () => {
    const result = parseWikilinks('[[Foo]]');
    expect(result).toEqual([
      {
        kind: 'link',
        target: 'Foo',
        label: 'Foo',
        isAnchor: false,
        isCrossDoc: true,
      },
    ]);
  });

  it('parses cross-doc + anchor', () => {
    const result = parseWikilinks('[[Foo#Bar]]');
    expect(result).toEqual([
      {
        kind: 'link',
        target: 'Foo#bar',
        label: 'Foo > Bar',
        isAnchor: false,
        isCrossDoc: true,
      },
    ]);
  });

  it('parses cross-doc + anchor + alias', () => {
    const result = parseWikilinks('[[Foo#Bar|see foo]]');
    expect(result).toEqual([
      {
        kind: 'link',
        target: 'Foo#bar',
        label: 'see foo',
        isAnchor: false,
        isCrossDoc: true,
      },
    ]);
  });

  it('parses multiple wikilinks in one string', () => {
    const result = parseWikilinks('see [[#A]] and [[#B]]');
    expect(result).toHaveLength(4);
    expect((result[1] as { target: string }).target).toBe('#a');
    expect((result[3] as { target: string }).target).toBe('#b');
  });

  it('leaves malformed wikilinks (unbalanced) as plain text', () => {
    const result = parseWikilinks('[[no-close and [[#good]]');
    // Only the well-formed one is parsed; the leading `[[no-close ` stays text.
    expect(result.map((s) => s.kind)).toEqual(['text', 'link']);
  });

  it('treats `[[]]` (empty) as plain text', () => {
    const result = parseWikilinks('[[]]');
    expect(result).toEqual([{ kind: 'text', value: '[[]]' }]);
  });

  it('preserves the trailing text after the last link', () => {
    const result = parseWikilinks('[[#A]] and end');
    expect(result[result.length - 1]).toEqual({ kind: 'text', value: ' and end' });
  });
});
