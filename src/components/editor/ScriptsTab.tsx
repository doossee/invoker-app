import { useEffect, useRef } from 'react';
import { EditorView, keymap } from '@codemirror/view';
import { Compartment, EditorState } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { defaultKeymap, indentWithTab } from '@codemirror/commands';
import { vim } from '@replit/codemirror-vim';
import { createIvkExtensions } from '@/lib/cm-ivk';
import { useEnvStore } from '@/stores/env-store';
import { useEditorStore } from '@/stores/editor-store';

interface Props {
  scripts: { pre: string; post: string; test: string };
  onChange: (scripts: { pre: string; post: string; test: string }) => void;
}

interface ScriptEditorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function ScriptEditor({ label, value, onChange }: ScriptEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const vimCompartmentRef = useRef<Compartment | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const envManager = useEnvStore((s) => s.envManager);
  const vimMode = useEditorStore((s) => s.vimMode);

  useEffect(() => {
    if (!containerRef.current) return;

    const vimCompartment = new Compartment();
    vimCompartmentRef.current = vimCompartment;

    const view = new EditorView({
      state: EditorState.create({
        doc: value,
        extensions: [
          vimCompartment.of(vimMode ? vim() : []),
          keymap.of([...defaultKeymap, indentWithTab]),
          javascript(),
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
      vimCompartmentRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [envManager]);

  // Hot-swap vim on toggle.
  useEffect(() => {
    const view = viewRef.current;
    const compartment = vimCompartmentRef.current;
    if (!view || !compartment) return;
    view.dispatch({ effects: compartment.reconfigure(vimMode ? vim() : []) });
  }, [vimMode]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current !== value) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
      });
    }
  }, [value]);

  return (
    <div className="space-y-1">
      <div className="text-xs font-mono text-on-surface-variant px-3 pt-2">{label}</div>
      <div ref={containerRef} className="min-h-[80px] max-h-[200px] overflow-auto" />
    </div>
  );
}

export function ScriptsTab({ scripts, onChange }: Props) {
  return (
    <div className="divide-y divide-outline-variant">
      <ScriptEditor
        label="> pre"
        value={scripts.pre}
        onChange={(pre) => onChange({ ...scripts, pre })}
      />
      <ScriptEditor
        label="> post"
        value={scripts.post}
        onChange={(post) => onChange({ ...scripts, post })}
      />
      <ScriptEditor
        label="> test"
        value={scripts.test}
        onChange={(test) => onChange({ ...scripts, test })}
      />
    </div>
  );
}
