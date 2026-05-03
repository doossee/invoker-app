import { useState, useMemo, useRef, useEffect, Fragment, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { Copy, Check } from 'lucide-react';
import { TOKENS } from '@/components/shared/primitives';

/**
 * Shared variable-token rendering used wherever `.ivk` text is displayed
 * outside of CodeMirror — inline blocks, URL bar overlay, etc. Matches the
 * CodeMirror hover tooltip visually (same `ivk-cm-tooltip-*` CSS classes)
 * so variables look and behave the same across the app.
 */

const VAR_REGEX = /\{\{(\w+)\}\}/g;

export function HighlightedText({
  text,
  resolver,
  onChangeVar,
}: {
  text: string;
  resolver: (name: string) => string | undefined;
  onChangeVar: (name: string, value: string) => void;
}) {
  const parts = useMemo(() => {
    const out: Array<{ key: number; text: string; kind: 'text' | 'var'; name?: string }> = [];
    let last = 0;
    let key = 0;
    VAR_REGEX.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = VAR_REGEX.exec(text)) !== null) {
      if (m.index > last) out.push({ key: key++, text: text.slice(last, m.index), kind: 'text' });
      out.push({ key: key++, text: m[0], kind: 'var', name: m[1] });
      last = m.index + m[0].length;
    }
    if (last < text.length) out.push({ key: key++, text: text.slice(last), kind: 'text' });
    return out;
  }, [text]);

  return (
    <>
      {parts.map((p) => {
        if (p.kind === 'text') return <Fragment key={p.key}>{p.text}</Fragment>;
        return (
          <VariableToken
            key={p.key}
            name={p.name!}
            raw={p.text}
            value={resolver(p.name!)}
            onChange={(v) => onChangeVar(p.name!, v)}
          />
        );
      })}
    </>
  );
}

export function VariableToken({
  name,
  raw,
  value,
  onChange,
}: {
  name: string;
  raw: string;
  value: string | undefined;
  onChange: (value: string) => void;
}) {
  const spanRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const hideTimerRef = useRef<number | null>(null);

  const isSet = value != null && value !== '';

  const show = () => {
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    setOpen(true);
  };
  // Small delay on hide so the mouse can bridge from the token to the popover
  // without the popover flickering closed.
  const scheduleHide = () => {
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    hideTimerRef.current = window.setTimeout(() => setOpen(false), 120);
  };

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    };
  }, []);

  return (
    <>
      <span
        ref={spanRef}
        onMouseEnter={show}
        onMouseLeave={scheduleHide}
        style={{
          color: isSet ? TOKENS.amber : TOKENS.red,
          fontWeight: 500,
          cursor: 'default',
          // Allow pointer events even when the surrounding overlay is
          // pointer-events: none (so hover works while clicks pass through).
          pointerEvents: 'auto',
        }}
      >
        {raw}
      </span>
      {open && spanRef.current && (
        <VariablePopover
          anchor={spanRef.current}
          name={name}
          value={value}
          onChange={onChange}
          onEnter={show}
          onLeave={scheduleHide}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

/**
 * Inner tooltip content — just the header + value row. Stateless wrt
 * positioning and wrapping. Used two ways:
 *   1. Wrapped by <VariablePopover> inside a React portal for non-CM callers
 *      (inline blocks, URL bar overlay).
 *   2. Mounted directly into a CodeMirror-managed tooltip DOM node via
 *      `createRoot`, so CM's .cm-tooltip wrapper handles positioning + chrome.
 *
 * One component means one source of truth for the variable popover UI.
 */
export function VariablePopoverContent({
  name,
  value,
  onChange,
  onEnter,
  onLeave,
}: {
  name: string;
  value: string | undefined;
  onChange: (value: string) => void;
  onEnter?: () => void;
  onLeave?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const isSet = value != null && value !== '';

  const handleCopy = () => {
    navigator.clipboard.writeText(value ?? '').then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="ivk-cm-tooltip-var" onMouseEnter={onEnter} onMouseLeave={onLeave}>
      <div className="ivk-cm-tooltip-header">
        <code className="ivk-cm-tooltip-name">{name}</code>
        <span className={isSet ? 'ivk-cm-tooltip-badge-set' : 'ivk-cm-tooltip-badge-unset'}>
          {isSet ? 'Environment' : 'Not Found'}
        </span>
      </div>
      <div className="ivk-cm-tooltip-value-row">
        <input
          className="ivk-cm-tooltip-input"
          type="text"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter value..."
          onKeyDown={(e) => {
            // Prevent parent listeners (editor, keyboard shortcuts) from
            // swallowing these keys while the user is editing the value.
            e.stopPropagation();
            if (e.key === 'Escape') (e.target as HTMLInputElement).blur();
          }}
        />
        <button
          className="ivk-cm-tooltip-copy"
          onClick={handleCopy}
          title="Copy value"
          style={copied ? { color: 'var(--ivk-success)' } : undefined}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
        </button>
      </div>
    </div>
  );
}

function VariablePopover({
  anchor,
  name,
  value,
  onChange,
  onEnter,
  onLeave,
  onClose,
}: {
  anchor: HTMLElement;
  name: string;
  value: string | undefined;
  onChange: (value: string) => void;
  onEnter: () => void;
  onLeave: () => void;
  onClose: () => void;
}) {
  // `position: fixed` + portal so we escape any overflow-hidden / stacking
  // -context ancestor (inline-block card, tab content panels, URL bar
  // overlay…). Background/border/shadow match the CodeMirror `.cm-tooltip`
  // theme rule in cm-ivk.ts.
  //
  // Default placement is ABOVE the token. If there isn't enough room above
  // (estimated popover height ~60px), flip BELOW so it doesn't render with
  // a negative `top` and overlap the tab strip / breadcrumb above the URL
  // bar — which was the user-visible bug.
  const rect = anchor.getBoundingClientRect();
  const ESTIMATED_HEIGHT = 64;
  const GAP = 8;
  const flipBelow = rect.top < ESTIMATED_HEIGHT + GAP;
  const style: CSSProperties = {
    position: 'fixed',
    left: Math.max(8, rect.left),
    top: flipBelow ? rect.bottom + GAP : rect.top - GAP,
    transform: flipBelow ? undefined : 'translateY(-100%)',
    zIndex: 1000,
    background: '#191a1a',
    border: '1px solid #484848',
    borderRadius: 6,
    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
  };

  // Keyboard dismissal — hover-only close stranded keyboard users and
  // anyone who'd already moved the cursor far away. Escape always works.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div style={style} onMouseEnter={onEnter} onMouseLeave={onLeave}>
      <VariablePopoverContent name={name} value={value} onChange={onChange} />
    </div>,
    document.body,
  );
}
