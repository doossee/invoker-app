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
import type { EnvManager } from 'ivkjs';

// ── Dark Theme ──────────────────────────────────────────────────────

const ivkTheme = EditorView.theme(
  {
    '&': {
      backgroundColor: '#14171e',
      color: '#e2e4e9',
      fontSize: '13px',
      fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
    },
    '.cm-content': {
      caretColor: '#ffffff',
      padding: '8px 0',
    },
    '&.cm-focused .cm-cursor': {
      borderLeftColor: '#ffffff',
    },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': {
      backgroundColor: 'rgba(59, 130, 246, 0.2)',
    },
    '.cm-gutters': {
      backgroundColor: '#14171e',
      color: '#5c6070',
      border: 'none',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'rgba(59, 130, 246, 0.08)',
    },
    '.cm-activeLine': {
      backgroundColor: 'rgba(59, 130, 246, 0.05)',
    },
    '.cm-matchingBracket': {
      backgroundColor: 'rgba(59, 130, 246, 0.25)',
      outline: 'none',
    },
    '.cm-tooltip': {
      backgroundColor: '#1c2029',
      border: '1px solid #2a2e3a',
      borderRadius: '6px',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
    },
    '.cm-tooltip-autocomplete': {
      '& > ul > li': {
        padding: '4px 8px',
      },
      '& > ul > li[aria-selected]': {
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
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
            const displayValue = isSet ? value : 'not set';

            dom.innerHTML = `
              <div class="ivk-cm-tooltip-header">
                <code class="ivk-cm-tooltip-name">${varName}</code>
                <span class="${statusClass}">${statusText}</span>
              </div>
              <div class="ivk-cm-tooltip-value ${isSet ? '' : 'ivk-cm-tooltip-unset'}">
                ${displayValue}
              </div>
            `;

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
    createVarDecoPlugin(envManager),
    createVarHoverTooltip(envManager),
  ];
}
