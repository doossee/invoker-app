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
import type { EnvManager } from 'ivkjs';

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
        const value = envManager.get(varName);
        const tooltip: Tooltip = {
          pos: from,
          end: to,
          above: true,
          create() {
            const dom = document.createElement('div');
            dom.className = 'ivk-cm-tooltip-var';

            const isSet = value !== undefined;
            const statusClass = isSet
              ? 'ivk-cm-tooltip-badge-set'
              : 'ivk-cm-tooltip-badge-unset';
            const statusText = isSet ? 'Environment' : 'Not Found';
            const displayValue = isSet ? String(value) : '';

            // Header: varName + source badge
            const header = document.createElement('div');
            header.className = 'ivk-cm-tooltip-header';
            header.innerHTML = `
              <code class="ivk-cm-tooltip-name">${varName}</code>
              <span class="${statusClass}">${statusText}</span>
            `;
            dom.appendChild(header);

            // Value row: editable input + copy button
            const valueRow = document.createElement('div');
            valueRow.className = 'ivk-cm-tooltip-value-row';

            const input = document.createElement('input');
            input.type = 'text';
            input.value = displayValue;
            input.placeholder = 'Enter value...';
            input.className = 'ivk-cm-tooltip-input';

            const copyBtn = document.createElement('button');
            copyBtn.className = 'ivk-cm-tooltip-copy';
            copyBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
            copyBtn.title = 'Copy value';
            copyBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(input.value);
              copyBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
              copyBtn.style.color = '#4ae176';
              setTimeout(() => {
                copyBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
                copyBtn.style.color = '';
              }, 1500);
            });

            valueRow.appendChild(input);
            valueRow.appendChild(copyBtn);
            dom.appendChild(valueRow);

            const saveValue = () => {
              const newVal = input.value;
              const store = (window as any).__ivk_env_store;
              if (store) {
                const state = store.getState();
                const envs = state.settings.environments;
                const idx = state.settings.activeEnvironmentIndex;
                if (envs[idx]) {
                  envs[idx].variables[varName] = newVal;
                  state.persist();
                  state.envManager.setEnvironments(envs, idx);
                }
              }
            };

            input.addEventListener('keydown', (e) => {
              e.stopPropagation();
              if (e.key === 'Enter') {
                saveValue();
                input.blur();
              }
              if (e.key === 'Escape') {
                input.blur();
              }
            });

            input.addEventListener('blur', saveValue);

            return { dom };
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
