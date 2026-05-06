import { createElement, useEffect, useRef, useState, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Eye, Pencil, Wand2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { remarkWikilinks } from '@/lib/remark-wikilinks';
import { slugifyHeading } from '@/lib/wikilinks';
import { useDocsStore } from '@/stores/docs-store';
// `useEditorStore` is also imported below; the cross-doc anchor
// override pulls openTab via `getState()` so the second import line
// stays as the canonical hook reference for hook-style consumers.
import {
  EditorView,
  keymap,
  Decoration,
  ViewPlugin,
  WidgetType,
  highlightActiveLine,
  type DecorationSet,
  type ViewUpdate,
} from '@codemirror/view';
import {
  Compartment,
  EditorState,
  RangeSetBuilder,
} from '@codemirror/state';
import { defaultKeymap, indentWithTab } from '@codemirror/commands';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { syntaxTree } from '@codemirror/language';
import { vim } from '@replit/codemirror-vim';
// (HighlightStyle / tags / syntaxHighlighting removed — block-level widget
// rendering covers all visual styling now.)
import { useEditorStore } from '@/stores/editor-store';
import { TOKENS } from '@/components/shared/primitives';
import { ivkCodeBlockRenderer } from '@/components/shared/InlineIvkBlock';

/* (HighlightStyle removed — block-level rendering covers everything now.) */

/* ------------------------------------------------------------------ */
/*  Live-preview plugin — block-level widget replacement                */
/*                                                                      */
/*  Each top-level markdown block (heading, paragraph, list, code       */
/*  block, blockquote, table, etc.) gets replaced by a block widget    */
/*  that renders its source via ReactMarkdown — looks exactly like     */
/*  Preview mode. The block containing the cursor is left as raw       */
/*  source, so editing that block feels exactly like Edit mode.        */
/*                                                                      */
/*  Click on a rendered block → cursor jumps inside, block flips to    */
/*  source. Cursor moves to a different block (vim, click, etc.) →    */
/*  the previous block re-renders, the new one becomes raw.            */
/* ------------------------------------------------------------------ */

/** Top-level markdown nodes from lezer-markdown that we render as blocks. */
const BLOCK_NODE_NAMES = new Set([
  'ATXHeading1', 'ATXHeading2', 'ATXHeading3', 'ATXHeading4', 'ATXHeading5', 'ATXHeading6',
  'SetextHeading1', 'SetextHeading2',
  'Paragraph',
  'BulletList', 'OrderedList',
  'Blockquote',
  'FencedCode', 'CodeBlock',
  'Table',
  'HorizontalRule',
  'HTMLBlock',
]);

/**
 * Replaces a markdown block with a ReactMarkdown rendering — same component
 * tree as Preview mode, so the look is identical. Click → moves the cursor
 * into the block, which causes the next build pass to leave the block as
 * raw source. We mount a real React root inside the widget so remarkGfm,
 * code highlighting via ReactMarkdown's `components` prop, etc. all work.
 */
class BlockMarkdownWidget extends WidgetType {
  constructor(
    private readonly source: string,
    private readonly fromPos: number,
  ) {
    super();
  }
  eq(other: WidgetType): boolean {
    return (
      other instanceof BlockMarkdownWidget &&
      other.source === this.source &&
      other.fromPos === this.fromPos
    );
  }
  toDOM(view: EditorView): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'invoker-prose cm-md-rendered-block';
    // Static-HTML render: avoids the React root + CM measurement race that
    // crashes vim's BlockCursorPlugin. Markdown blocks are mostly static
    // (links, headings, lists, code) so we don't need React reactivity here.
    wrapper.innerHTML = renderToStaticMarkup(
      createElement(ReactMarkdown, { remarkPlugins: [remarkGfm] }, this.source),
    );

    // Click → move cursor into this block so it becomes editable. Skip if
    // the click hit a link so it can navigate normally.
    wrapper.addEventListener('mousedown', (e) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'A') return;
      e.preventDefault();
      view.dispatch({ selection: { anchor: this.fromPos } });
      view.focus();
    });
    return wrapper;
  }
  ignoreEvent(event: Event): boolean {
    // Let mousedown reach our handler; CM handles the rest.
    return event.type !== 'mousedown';
  }
  get estimatedHeight() {
    return -1; // let CM measure on render
  }
}

const livePreviewPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(view: EditorView) {
      this.decorations = build(view);
    }
    update(update: ViewUpdate) {
      // selectionSet rebuilds — moving the cursor between blocks flips
      // their rendered/source state.
      if (update.docChanged || update.viewportChanged || update.selectionSet) {
        this.decorations = build(update.view);
      }
    }
  },
  { decorations: (v) => v.decorations },
);

function build(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const tree = syntaxTree(view.state);
  const doc = view.state.doc;
  const sel = view.state.selection.main;
  // A block is "active" if the cursor or the selection range overlaps it.
  // Using the full selection range means a multi-block selection keeps all
  // covered blocks in source mode for clean editing across boundaries.
  const isActiveBlock = (from: number, to: number) =>
    sel.head >= from && sel.head <= to ||
    sel.anchor >= from && sel.anchor <= to ||
    (sel.from <= to && sel.to >= from);

  tree.iterate({
    enter(node) {
      if (!BLOCK_NODE_NAMES.has(node.name)) return; // descend looking for blocks
      if (isActiveBlock(node.from, node.to)) return false; // leave as raw source

      const source = doc.sliceString(node.from, node.to);
      // `block: true` requires the range to span entire lines and creates
      // a CM block-level structural change — vim's BlockCursorPlugin and
      // CM's coordsAtPos can race during mount and crash. Plain inline
      // replace is safer: the widget renders in-flow on its line(s),
      // visually still a block because the markdown content is block-level.
      builder.add(
        node.from,
        node.to,
        Decoration.replace({
          widget: new BlockMarkdownWidget(source, node.from),
        }),
      );
      return false; // don't descend — block replaced wholesale
    },
  });
  return builder.finish();
}

/* ------------------------------------------------------------------ */
/*  Markdown editor                                                    */
/*                                                                      */
/*  `livePreview=false` (Edit mode): plain markdown source — visible   */
/*  syntax markers, no widgets, no inline styling beyond what the      */
/*  default markdown grammar provides. Mirrors Obsidian's Source mode. */
/*                                                                      */
/*  `livePreview=true` (Live mode, vim-only): hides markers off the    */
/*  cursor line, renders headings/bold/italic/links/etc. inline,       */
/*  task markers become real checkboxes, images render inline.         */
/*  Mirrors Obsidian's Live Preview.                                   */
/* ------------------------------------------------------------------ */
export function MarkdownEditor({
  value,
  onChange,
  livePreview = false,
}: {
  value: string;
  onChange: (v: string) => void;
  livePreview?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const vimCompartmentRef = useRef<Compartment | null>(null);
  const liveCompartmentRef = useRef<Compartment | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const vimMode = useEditorStore((s) => s.vimMode);

  useEffect(() => {
    if (!containerRef.current) return;
    const vimCompartment = new Compartment();
    const liveCompartment = new Compartment();
    vimCompartmentRef.current = vimCompartment;
    liveCompartmentRef.current = liveCompartment;

    const view = new EditorView({
      state: EditorState.create({
        doc: value,
        extensions: [
          // Vim's BlockCursorPlugin races with block-replacing widgets and
          // crashes coordsAtPos. We disable vim inside Live mode regardless
          // of the global setting; navigation falls back to arrow keys and
          // clicks (each rendered block is click-to-edit). Edit mode keeps
          // vim as long as the user has it on globally.
          vimCompartment.of(vimMode && !livePreview ? vim() : []),
          keymap.of([...defaultKeymap, indentWithTab]),
          // GFM base enables tables, strikethrough, and task lists; the
          // `codeLanguages` option lazily loads syntax for whatever language
          // is named on each fenced ```block.
          markdown({ base: markdownLanguage, codeLanguages: languages }),
          // Live-preview extensions are gated by a Compartment so they can be
          // toggled at runtime without recreating the EditorView (keeps cursor
          // position, history, and vim state intact across mode switches).
          liveCompartment.of(livePreview ? livePreviewExtensions() : []),
          EditorView.lineWrapping,
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              onChangeRef.current(update.state.doc.toString());
            }
          }),
        ],
      }),
      parent: containerRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
      vimCompartmentRef.current = null;
      liveCompartmentRef.current = null;
    };
    // Mount-only — value changes are pushed via transactions below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current !== value) {
      view.dispatch({ changes: { from: 0, to: current.length, insert: value } });
    }
  }, [value]);

  useEffect(() => {
    const view = viewRef.current;
    const compartment = vimCompartmentRef.current;
    if (!view || !compartment) return;
    view.dispatch({ effects: compartment.reconfigure(vimMode && !livePreview ? vim() : []) });
  }, [vimMode, livePreview]);

  useEffect(() => {
    const view = viewRef.current;
    const compartment = liveCompartmentRef.current;
    if (!view || !compartment) return;
    view.dispatch({
      effects: compartment.reconfigure(livePreview ? livePreviewExtensions() : []),
    });
  }, [livePreview]);

  return <div ref={containerRef} style={{ height: '100%', padding: '12px 0' }} />;
}

function livePreviewExtensions() {
  // `highlightActiveLine` adds a `cm-activeLine` class to the cursor's line
  // so within the active (raw) block the user can see which line is the
  // immediate cursor.
  return [livePreviewPlugin, highlightActiveLine()];
}

/* ------------------------------------------------------------------ */
/*  Read-only preview                                                  */
/* ------------------------------------------------------------------ */
export function MarkdownPreview({ content, components }: { content: string; components?: React.ComponentProps<typeof ReactMarkdown>['components'] }) {
  // Default to the shared `ivk` codeblock renderer so EVERY caller gets
  // runnable inline ivk blocks (not just folder-README's FolderTabBody).
  // Caller-provided `components` win on key collision so existing custom
  // renderers in FolderTabBody continue to take precedence.
  const merged: React.ComponentProps<typeof ReactMarkdown>['components'] = {
    code: ivkCodeBlockRenderer,
    // Add `id` attributes to headings so `[[#anchor]]` wikilinks
    // (rewritten as `<a href="#slug">` by remarkWikilinks) actually
    // scroll to the right place.
    h1: HeadingWithId('h1'),
    h2: HeadingWithId('h2'),
    h3: HeadingWithId('h3'),
    h4: HeadingWithId('h4'),
    h5: HeadingWithId('h5'),
    h6: HeadingWithId('h6'),
    // Intercept `invoker:doc/...` cross-doc wikilinks and route them
    // through the editor-store as new tabs. Browsers wouldn't know
    // what to do with the custom scheme otherwise.
    a: WikilinkAwareAnchor,
    ...(components ?? {}),
  };
  return (
    <div className="invoker-prose">
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkWikilinks]} components={merged}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Heading renderer (adds `id` for in-page anchor links)              */
/* ------------------------------------------------------------------ */
function HeadingWithId(tag: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6') {
  return function Heading(props: React.HTMLAttributes<HTMLHeadingElement> & { children?: ReactNode }) {
    const text = childrenToString(props.children);
    const id = slugifyHeading(text);
    return createElement(tag, { ...props, id }, props.children);
  };
}

function childrenToString(children: ReactNode): string {
  if (children == null) return '';
  if (typeof children === 'string' || typeof children === 'number') {
    return String(children);
  }
  if (Array.isArray(children)) return children.map(childrenToString).join('');
  if (typeof children === 'object' && 'props' in children) {
    return childrenToString((children as { props: { children?: ReactNode } }).props.children);
  }
  return '';
}

/* ------------------------------------------------------------------ */
/*  Anchor renderer (handles `invoker:doc/<target>` cross-doc links)   */
/* ------------------------------------------------------------------ */
function WikilinkAwareAnchor({ href, children, ...rest }: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const isCrossDoc = typeof href === 'string' && href.startsWith('invoker:doc/');

  if (!isCrossDoc) {
    // Pass-through for normal links + in-page anchors. The browser
    // handles `#slug` natively now that headings have `id`s.
    return <a href={href} {...rest}>{children}</a>;
  }

  // `invoker:doc/<target>` where target is a doc path or basename,
  // optionally with a trailing `#anchor` for scroll target.
  const raw = href!.slice('invoker:doc/'.length);
  const hashIdx = raw.indexOf('#');
  const docPart = hashIdx === -1 ? raw : raw.slice(0, hashIdx);
  const anchor = hashIdx === -1 ? null : raw.slice(hashIdx + 1);

  const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const docs = useDocsStore.getState().docs;
    // Resolution: exact path match first, then basename match without
    // `.md`. Mirrors Obsidian's "search vault by filename" behaviour.
    const target =
      docs.find((d) => d.path === docPart) ??
      docs.find((d) => d.path === `${docPart}.md`) ??
      docs.find((d) => d.path.split('/').pop() === `${docPart}.md`) ??
      docs.find((d) => d.path.split('/').pop()?.replace(/\.md$/, '') === docPart);
    if (!target) {
      // Unresolved — surface so the user knows the link is broken
      // rather than silently swallowing the click.
      // eslint-disable-next-line no-alert
      window.alert(
        `Couldn't find a doc matching "${docPart}". Wikilinks resolve by full path or by basename across all loaded docs.`,
      );
      return;
    }
    const name = target.path.split('/').pop()?.replace(/\.md$/, '') ?? target.path;
    useEditorStore.getState().openTab({ kind: 'doc', path: target.path, name });
    // Scroll to the anchor inside the freshly-opened doc on the next
    // paint. The browser doesn't auto-scroll because we're navigating
    // app-state, not the URL.
    if (anchor) {
      window.setTimeout(() => {
        const el = document.getElementById(anchor);
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  };

  return (
    <a href={href} onClick={onClick} data-invoker-wikilink="true" {...rest}>
      {children}
    </a>
  );
}

/* ------------------------------------------------------------------ */
/*  Mode bar                                                           */
/* ------------------------------------------------------------------ */
export type DocViewMode = 'edit' | 'preview' | 'live';

export function ModeBar({
  mode,
  setMode,
  dirty,
  left,
}: {
  mode: DocViewMode;
  setMode: (m: DocViewMode) => void;
  dirty?: boolean;
  left?: ReactNode;
}) {
  // Live mode (Obsidian-style hybrid: cursor line raw, others rendered)
  // requires vim navigation to feel right, so we only expose the toggle when
  // the user has vim mode on. Falling back to plain Edit is fine elsewhere.
  const vimMode = useEditorStore((s) => s.vimMode);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 10px',
        borderBottom: `1px solid ${TOKENS.strokeSoft}`,
        flexShrink: 0,
      }}
    >
      {left}
      {dirty && (
        <span
          title="Unsaved changes"
          style={{
            width: 5,
            height: 5,
            borderRadius: 9999,
            background: TOKENS.amber,
            marginLeft: 4,
          }}
        />
      )}
      <div style={{ flex: 1 }} />
      <ModeButton active={mode === 'preview'} onClick={() => setMode('preview')}>
        <Eye size={11} /> Preview
      </ModeButton>
      <ModeButton active={mode === 'edit'} onClick={() => setMode('edit')}>
        <Pencil size={11} /> Edit
      </ModeButton>
      {vimMode && (
        <ModeButton active={mode === 'live'} onClick={() => setMode('live')}>
          <Wand2 size={11} /> Live
        </ModeButton>
      )}
    </div>
  );
}

function ModeButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '3px 8px',
        background: active ? TOKENS.s4 : 'transparent',
        color: active ? TOKENS.fg1 : TOKENS.fg3,
        border: 'none',
        borderRadius: 4,
        fontFamily: 'inherit',
        fontSize: 11,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Hook: edit/preview state with dirty + ⌘S save                       */
/* ------------------------------------------------------------------ */
export function useMarkdownDoc({
  path,
  initialContent,
  onSave,
  markDirty,
}: {
  path: string;
  initialContent: string;
  // Permissive return type — saveDoc returns Promise<boolean>, other callers
  // may return Promise<void>. We don't read the value, only await completion.
  onSave: (content: string) => void | Promise<unknown>;
  markDirty: (path: string, dirty: boolean) => void;
}) {
  const [mode, setMode] = useState<DocViewMode>('preview');
  const [draft, setDraft] = useState(initialContent);
  const vimMode = useEditorStore((s) => s.vimMode);

  // Re-sync if the path changes externally (different doc opened).
  const lastPathRef = useRef(path);
  useEffect(() => {
    if (lastPathRef.current !== path) {
      lastPathRef.current = path;
      setDraft(initialContent);
    }
  }, [path, initialContent]);

  // Live mode is only available when vim is on. If vim gets disabled while
  // the user is in live mode, drop them back to plain Edit so the mode bar
  // and the editor stay consistent.
  useEffect(() => {
    if (!vimMode && mode === 'live') {
      setMode('edit');
    }
  }, [vimMode, mode]);

  const dirty = draft !== initialContent;

  // ⌘S routing — listens on the same global event channel that RequestEditor
  // uses, so the existing keyboard shortcut works for whichever tab is mounted.
  // The await + try/catch matters: previously the handler called
  // `void onSave(...)` and then `markDirty(false)` synchronously — clearing
  // the dirty flag before the disk write completed (and silently swallowing
  // any rejection). When the write actually failed (Tauri permission /
  // disk-full), the UI showed "saved" while the file on disk was unchanged.
  // Same pattern PR #65 fixed for RequestEditor's request save.
  useEffect(() => {
    const handler = async () => {
      try {
        await onSave(draft);
        markDirty(path, false);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error('Doc save failed:', e);
        // eslint-disable-next-line no-alert
        window.alert(
          `Save failed: ${msg}\n\nYour edits are still in memory. Try again or open DevTools for details.`,
        );
      }
    };
    const onSaveEvent = () => {
      void handler();
    };
    window.addEventListener('invoker:save', onSaveEvent);
    return () => window.removeEventListener('invoker:save', onSaveEvent);
  }, [draft, path, onSave, markDirty]);

  function setDraftAndDirty(next: string) {
    setDraft(next);
    markDirty(path, next !== initialContent);
  }

  return { mode, setMode, draft, setDraft: setDraftAndDirty, dirty };
}
