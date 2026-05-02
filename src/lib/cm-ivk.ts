import {
  EditorView,
  Decoration,
  ViewPlugin,
  hoverTooltip,
  type DecorationSet,
  type ViewUpdate,
  type Tooltip,
} from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';
import type { Extension } from '@codemirror/state';
import { syntaxHighlighting, HighlightStyle } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { EnvManager } from 'ivkjs';
import { VariablePopoverContent } from '@/components/shared/VariableTokens';

// ── Syntax Highlighting (matching the design spec) ──────────────────

const invokerHighlight = HighlightStyle.define([
  // Strings — soft green
  { tag: tags.string, color: '#a3d6a7' },
  // Property names / keys — on-surface-variant
  { tag: tags.propertyName, color: '#acabaa' },
  // Numbers — blue
  { tag: tags.number, color: '#60a5fa' },
  // Booleans — amber dim
  { tag: tags.bool, color: '#dbc3a1' },
  // null — amber dim
  { tag: tags.null, color: '#dbc3a1' },
  // Braces, brackets, punctuation
  { tag: tags.brace, color: '#acabaa' },
  { tag: tags.squareBracket, color: '#acabaa' },
  { tag: tags.separator, color: '#767575' },     // commas
  { tag: tags.punctuation, color: '#acabaa' },    // colons
]);

// ── Dark Theme ──────────────────────────────────────────────────────

const ivkTheme = EditorView.theme(
  {
    '&': {
      backgroundColor: 'transparent',
      color: '#e7e5e4',
      fontSize: '13px',
      fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
      lineHeight: '1.6',
    },
    '.cm-content': {
      caretColor: '#e6c188',
      padding: '12px 0',
    },
    '&.cm-focused .cm-cursor': {
      borderLeftColor: '#e6c188',
    },
    '&.cm-focused': {
      outline: 'none',
    },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': {
      backgroundColor: 'rgba(230, 193, 136, 0.15)',
    },
    '.cm-gutters': {
      backgroundColor: 'transparent',
      color: '#484848',
      border: 'none',
      minWidth: '36px',
    },
    '.cm-lineNumbers .cm-gutterElement': {
      textAlign: 'right',
      padding: '0 8px 0 12px',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'transparent',
      color: '#767575',
    },
    '.cm-activeLine': {
      backgroundColor: 'transparent',
    },
    '.cm-matchingBracket': {
      backgroundColor: 'rgba(230, 193, 136, 0.2)',
      outline: 'none',
    },
    '.cm-placeholder': {
      color: '#767575',
      fontStyle: 'italic',
    },
    '.cm-tooltip': {
      backgroundColor: '#191a1a',
      border: '1px solid #484848',
      borderRadius: '6px',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
    },
    '.cm-tooltip-autocomplete': {
      '& > ul > li': {
        padding: '4px 8px',
      },
      '& > ul > li[aria-selected]': {
        backgroundColor: 'rgba(230, 193, 136, 0.15)',
      },
    },
  },
  { dark: true },
);

// ── Variable Decoration ─────────────────────────────────────────────

const varSetMark = Decoration.mark({ class: 'ivk-cm-var-set' });
const varUnsetMark = Decoration.mark({ class: 'ivk-cm-var-unset' });

const VAR_REGEX = /\{\{(\w+)\}\}/g;

function buildDecorations(view: EditorView, envManager: EnvManager): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const doc = view.state.doc;
  const text = doc.toString();

  let match: RegExpExecArray | null;
  VAR_REGEX.lastIndex = 0;
  while ((match = VAR_REGEX.exec(text)) !== null) {
    const varName = match[1];
    const from = match.index;
    const to = from + match[0].length;
    const resolved = envManager.get(varName);
    builder.add(from, to, resolved !== undefined ? varSetMark : varUnsetMark);
  }

  return builder.finish();
}

function createVarDecoPlugin(envManager: EnvManager) {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      constructor(view: EditorView) {
        this.decorations = buildDecorations(view, envManager);
      }
      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged) {
          this.decorations = buildDecorations(update.view, envManager);
        }
      }
    },
    { decorations: (v) => v.decorations },
  );
}

// ── Variable Hover Tooltip ──────────────────────────────────────────
//
// Mounts the shared <VariablePopoverContent> React component into a DOM
// node managed by CodeMirror. One component, one visual style, one
// persistence path — used here, in the URL bar overlay, and in inline
// ivk blocks inside markdown docs. Previously this was a parallel
// imperative DOM implementation; keeping a second codebase in sync with
// the React version was the bug the user hit.

function createVarHoverTooltip(envManager: EnvManager) {
  return hoverTooltip((view, pos) => {
    const doc = view.state.doc;
    const text = doc.toString();

    VAR_REGEX.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = VAR_REGEX.exec(text)) !== null) {
      const from = match.index;
      const to = from + match[0].length;
      if (pos >= from && pos <= to) {
        const varName = match[1];
        const tooltip: Tooltip = {
          pos: from,
          end: to,
          above: true,
          create() {
            const dom = document.createElement('div');
            const root: Root = createRoot(dom);

            // Writes to the active env via the globally-exposed store so the
            // React component stays UI-only. Keep this in sync with how
            // other call sites (URL bar, inline block) use the env hook.
            const saveValue = (newVal: string) => {
              const store = (window as unknown as { __ivk_env_store?: { getState: () => { setVariable: (name: string, value: string) => void } } }).__ivk_env_store;
              store?.getState().setVariable(varName, newVal);
              render(); // pull fresh value and re-render so the input reflects it
            };

            const render = () => {
              const value = envManager.get(varName);
              root.render(
                createElement(VariablePopoverContent, {
                  name: varName,
                  value,
                  onChange: saveValue,
                }),
              );
            };
            render();

            return {
              dom,
              destroy() {
                // Detach React tree so subsequent renders don't leak.
                root.unmount();
              },
            };
          },
        };
        return tooltip;
      }
    }
    return null;
  });
}

// ── Public API ───────────────────────────────────────────────────────

export function createIvkExtensions(envManager: EnvManager): Extension[] {
  return [
    ivkTheme,
    syntaxHighlighting(invokerHighlight),
    createVarDecoPlugin(envManager),
    createVarHoverTooltip(envManager),
  ];
}
