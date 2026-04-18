import { useEffect, useRef, useCallback } from 'react';
import { EditorView, keymap } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { json } from '@codemirror/lang-json';
import { defaultKeymap, indentWithTab } from '@codemirror/commands';
import { createIvkExtensions } from '@/lib/cm-ivk';
import { useEnvStore } from '@/stores/env-store';

interface Props {
  body: string;
  onChange: (body: string) => void;
}

export function BodyTab({ body, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const envManager = useEnvStore((s) => s.envManager);

  // Create editor on mount
  useEffect(() => {
    if (!containerRef.current) return;

    const view = new EditorView({
      state: EditorState.create({
        doc: body,
        extensions: [
          keymap.of([...defaultKeymap, indentWithTab]),
          json(),
          ...createIvkExtensions(envManager),
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
    };
    // Only run on mount — body changes are pushed via transactions below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [envManager]);

  // Sync external body changes into the editor
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current !== body) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: body },
      });
    }
  }, [body]);

  const formatJson = useCallback(() => {
    const view = viewRef.current;
    if (!view) return;
    const text = view.state.doc.toString();
    try {
      const formatted = JSON.stringify(JSON.parse(text), null, 2);
      view.dispatch({
        changes: { from: 0, to: text.length, insert: formatted },
      });
      onChangeRef.current(formatted);
    } catch {
      // Not valid JSON — silently ignore
    }
  }, []);

  // Listen for Cmd+Shift+F keyboard shortcut
  useEffect(() => {
    const handler = () => formatJson();
    window.addEventListener('invoker:format-json-editor', handler);
    return () => window.removeEventListener('invoker:format-json-editor', handler);
  }, [formatJson]);

  return (
    <div className="flex flex-col h-full">
      <div ref={containerRef} className="flex-1 overflow-auto" />
      <div className="flex items-center px-3 py-1.5 ghost-border-t">
        <button
          onClick={formatJson}
          className="text-xs text-on-surface-variant hover:text-primary transition-colors"
        >
          Format JSON
        </button>
      </div>
    </div>
  );
}
