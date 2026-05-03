import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { TOKENS } from '@/components/shared/primitives';
import { useEditorStore } from '@/stores/editor-store';
import { ivkCodeBlockRenderer } from '@/components/shared/InlineIvkBlock';

/**
 * React-based "Live" markdown view.
 *
 *   - Whole doc renders block-by-block via ReactMarkdown — looks exactly
 *     like Preview mode.
 *   - The block containing the cursor swaps to a `<textarea>` so you edit
 *     raw markdown for that block — exactly like Edit mode.
 *   - Click a block to focus it. Use ↑ / ↓ at the textarea's first/last
 *     line to move between blocks (k/j-like, regardless of vim).
 *
 *   We intentionally don't use CodeMirror here: CM block-replacing widgets
 *   race with vim's BlockCursorPlugin and crash the whole app. A pure
 *   React tree is simple, robust, and produces identical Preview output.
 *
 *   Block boundaries are determined by lezer-markdown's top-level parse
 *   tree — same logic the rendered Preview uses, so block boundaries
 *   match what the user sees rendered.
 */

interface Block {
  /** Inclusive start offset in `source`. */
  from: number;
  /** Exclusive end offset in `source`. */
  to: number;
  /** The block's raw markdown text, trimmed only at the document boundary. */
  text: string;
}

/**
 * Split markdown into per-line blocks. Each non-blank line is its own
 * block — so the user can click any line to switch just that line into
 * raw-source editing while every other line stays rendered (Obsidian
 * Live Preview behaviour).
 *
 * Exception: fenced code blocks (``` ... ```) stay grouped as one block
 * so syntax highlighting and the fence boundaries render correctly.
 * Splitting them per-line would break the rendered output entirely.
 */
function parseBlocks(source: string): Block[] {
  const blocks: Block[] = [];
  const lines = source.split('\n');
  let lineStart = 0;
  // While inside a fenced code block, track the start so we can emit the
  // whole region as one block when we hit the closing fence.
  let fenceStart = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineEnd = lineStart + line.length;
    const isFence = /^```/.test(line.trimStart());

    if (fenceStart !== -1) {
      // Inside a fenced block — keep accumulating.
      if (isFence) {
        // Closing fence: emit the entire fence range (including this line).
        blocks.push({
          from: fenceStart,
          to: lineEnd,
          text: source.slice(fenceStart, lineEnd),
        });
        fenceStart = -1;
      }
    } else if (isFence) {
      // Opening fence: start accumulating until the closing fence.
      fenceStart = lineStart;
    } else if (line.length > 0 || line.trim() !== '') {
      // Non-blank line outside a fence → its own block.
      blocks.push({
        from: lineStart,
        to: lineEnd,
        text: line,
      });
    }
    // Blank lines outside a fence emit no block — they render as the
    // natural whitespace between rendered blocks.

    lineStart = lineEnd + 1; // +1 for the '\n' separator
  }
  // Unclosed fence → render whatever we accumulated as one block.
  if (fenceStart !== -1) {
    blocks.push({
      from: fenceStart,
      to: source.length,
      text: source.slice(fenceStart),
    });
  }
  return blocks;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  /** Custom renderers for ReactMarkdown — passed through unchanged. */
  components?: React.ComponentProps<typeof ReactMarkdown>['components'];
}

export function MarkdownLivePreview({ value, onChange, components }: Props) {
  const blocks = useMemo(() => parseBlocks(value), [value]);
  // Default to the shared `ivk` codeblock renderer so EVERY caller (folder
  // README + standalone .md tabs) gets runnable inline ivk blocks. Caller-
  // provided `components` win on key collision.
  const mergedComponents: typeof components = {
    code: ivkCodeBlockRenderer,
    ...(components ?? {}),
  };
  const vimMode = useEditorStore((s) => s.vimMode);
  // Active block = the one currently being edited as raw markdown.
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  // Vim "selected" line — when vim is on but we're in normal mode (no
  // textarea focused), this line shows a focus ring and is the target of
  // i/Enter to enter insert mode. j/k move the selection.
  const [vimSelectedIdx, setVimSelectedIdx] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  // One DOM ref per block so we can scroll the vim-selected line into view
  // when j/k navigates past the visible viewport.
  const blockRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Clamp vim selection if the doc shrinks below the previous selected idx.
  useEffect(() => {
    if (vimSelectedIdx >= blocks.length && blocks.length > 0) {
      setVimSelectedIdx(blocks.length - 1);
    }
  }, [blocks.length, vimSelectedIdx]);

  // Auto-focus the textarea whenever a block becomes active so typing
  // immediately goes to the source.
  useEffect(() => {
    if (activeIdx !== null && textareaRef.current) {
      textareaRef.current.focus();
      // Move cursor to end so users can keep typing after switching.
      const len = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(len, len);
      // Scroll the active textarea into view if it's been pushed off-screen
      // by previous edits. `block: 'nearest'` only scrolls if needed.
      textareaRef.current.scrollIntoView({ block: 'nearest' });
    } else if (activeIdx === null && vimMode && containerRef.current) {
      // Returning to normal mode: focus the container so j/k keypresses
      // route to our handler and not the surrounding page.
      containerRef.current.focus();
    }
  }, [activeIdx, vimMode]);

  // Keep the vim-selected block in view as the user navigates with j/k.
  // Only acts when in normal mode (no active textarea) so we don't fight
  // the textarea's own scroll behaviour. Uses instant scroll (not 'smooth')
  // so rapid j-presses don't interrupt each other mid-animation.
  useEffect(() => {
    if (!vimMode || activeIdx !== null) return;
    const el = blockRefs.current[vimSelectedIdx];
    if (el) {
      el.scrollIntoView({ block: 'nearest' });
    }
  }, [vimSelectedIdx, vimMode, activeIdx]);

  // Vim normal-mode keybindings on the container. We only listen when the
  // user is NOT inside a textarea — when the textarea has focus, those
  // events stay with it. j/k navigate; i/Enter/o open the selected line
  // for editing; gg/G jump to top/bottom.
  const normalModeKeyHandler = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!vimMode || activeIdx !== null) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return; // leave shortcuts alone

    if (e.key === 'j' || e.key === 'ArrowDown') {
      e.preventDefault();
      setVimSelectedIdx((idx) => Math.min(idx + 1, blocks.length - 1));
      return;
    }
    if (e.key === 'k' || e.key === 'ArrowUp') {
      e.preventDefault();
      setVimSelectedIdx((idx) => Math.max(idx - 1, 0));
      return;
    }
    if (e.key === 'G') {
      e.preventDefault();
      setVimSelectedIdx(blocks.length - 1);
      return;
    }
    // gg — handled by tracking previous keypress would be ideal; for now
    // the common alternative `0` jumps to top.
    if (e.key === '0' || (e.key === 'g' && (e.shiftKey === false))) {
      e.preventDefault();
      setVimSelectedIdx(0);
      return;
    }
    // Enter insert mode on the selected line.
    if (e.key === 'i' || e.key === 'a' || e.key === 'o' || e.key === 'Enter') {
      e.preventDefault();
      setActiveIdx(vimSelectedIdx);
      return;
    }
  };

  function commitBlock(idx: number, newText: string) {
    const block = blocks[idx];
    if (!block) return;
    // Splice the new text into the full source. Boundary characters (the
    // surrounding blank lines / newlines) outside the block range stay intact.
    const before = value.slice(0, block.from);
    const after = value.slice(block.to);
    onChange(before + newText + after);
  }

  function handleTextareaKeyDown(e: KeyboardEvent<HTMLTextAreaElement>, idx: number) {
    const ta = e.currentTarget;
    const isAtTop = ta.selectionStart === 0 && ta.selectionEnd === 0;
    const isAtBottom = ta.selectionStart === ta.value.length && ta.selectionEnd === ta.value.length;

    // ArrowUp at the top of this block → move to previous block.
    if (e.key === 'ArrowUp' && isAtTop && idx > 0) {
      e.preventDefault();
      setActiveIdx(idx - 1);
      setVimSelectedIdx(idx - 1);
      return;
    }
    // ArrowDown at the bottom → next block.
    if (e.key === 'ArrowDown' && isAtBottom && idx < blocks.length - 1) {
      e.preventDefault();
      setActiveIdx(idx + 1);
      setVimSelectedIdx(idx + 1);
      return;
    }
    // Escape → exit insert mode. With vim on, fall back to normal mode
    // (selection stays on this line). Without vim, just defocus.
    if (e.key === 'Escape') {
      e.preventDefault();
      setVimSelectedIdx(idx);
      setActiveIdx(null);
      ta.blur();
    }
  }

  if (blocks.length === 0) {
    return (
      <div
        onClick={() => onChange('')}
        style={{ padding: '28px 40px 60px', color: TOKENS.fg3, fontSize: 13, cursor: 'text' }}
      >
        Empty document — click and start typing.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      tabIndex={vimMode ? 0 : -1}
      onKeyDown={normalModeKeyHandler}
      // outline: none on the container — we draw our own focus ring on the
      // selected block instead, so the whole panel doesn't get a focus glow.
      style={{ padding: '28px 40px 60px', outline: 'none' }}
    >
      <div style={{ maxWidth: 680, margin: '0 auto' }} className="invoker-prose">
        {blocks.map((block, idx) => {
          if (idx === activeIdx) {
            return (
              <BlockTextarea
                key={`${block.from}-edit`}
                value={block.text}
                onChange={(next) => commitBlock(idx, next)}
                onKeyDown={(e) => handleTextareaKeyDown(e, idx)}
                textareaRef={textareaRef}
              />
            );
          }
          const vimSelected = vimMode && activeIdx === null && idx === vimSelectedIdx;
          return (
            <div
              key={`${block.from}-view`}
              ref={(el) => {
                blockRefs.current[idx] = el;
              }}
              onMouseDown={(e) => {
                // Don't hijack link / interactive clicks.
                const tag = (e.target as HTMLElement).tagName;
                if (tag === 'A' || tag === 'INPUT' || tag === 'BUTTON') return;
                e.preventDefault();
                setVimSelectedIdx(idx);
                setActiveIdx(idx);
              }}
              className="cm-md-rendered-block"
              style={{
                cursor: 'text',
                // Vim normal-mode selection ring on the line that j/k would
                // act on. Subtle so it doesn't fight rendered content.
                background: vimSelected ? 'rgba(230,193,136,0.08)' : 'transparent',
                boxShadow: vimSelected ? `inset 2px 0 0 ${TOKENS.amber}` : 'none',
                paddingLeft: vimSelected ? 8 : 0,
                marginLeft: vimSelected ? -8 : 0,
              }}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={mergedComponents}>
                {block.text}
              </ReactMarkdown>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Auto-sizing textarea for editing one markdown block. Height follows
 * content via a one-pass `scrollHeight` measurement on every keystroke so
 * the editor visually replaces the rendered block in-place.
 */
function BlockTextarea({
  value,
  onChange,
  onKeyDown,
  textareaRef,
}: {
  value: string;
  onChange: (next: string) => void;
  onKeyDown: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
  textareaRef: React.MutableRefObject<HTMLTextAreaElement | null>;
}) {
  const localRef = useRef<HTMLTextAreaElement | null>(null);

  // Auto-grow: collapse to 0 then read scrollHeight so the textarea
  // shrinks on delete as well as grows on insert.
  const resize = (el: HTMLTextAreaElement) => {
    el.style.height = '0';
    el.style.height = `${el.scrollHeight}px`;
  };

  useEffect(() => {
    if (localRef.current) resize(localRef.current);
  }, [value]);

  return (
    <textarea
      ref={(el) => {
        localRef.current = el;
        textareaRef.current = el;
      }}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      // No onBlur deactivation — focus moves should stay until the user
      // explicitly switches block (click) or hits Esc. Otherwise tabbing
      // out (e.g. to the SAVE button) immediately hides the textarea.
      spellCheck={false}
      style={{
        display: 'block',
        width: '100%',
        margin: '0 0 8px',
        padding: '4px 0',
        background: 'rgba(230,193,136,0.045)',
        border: 'none',
        outline: 'none',
        resize: 'none',
        color: TOKENS.fg1,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 13,
        lineHeight: 1.6,
        boxShadow: `inset 2px 0 0 ${TOKENS.amber}`,
        paddingLeft: 8,
      }}
    />
  );
}
