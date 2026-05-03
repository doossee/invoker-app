import { useEffect, useRef, useCallback, useState } from 'react';
import { EditorView, keymap, lineNumbers, placeholder } from '@codemirror/view';
import { Compartment, EditorState } from '@codemirror/state';
import { json } from '@codemirror/lang-json';
import { defaultKeymap, indentWithTab } from '@codemirror/commands';
import { vim } from '@replit/codemirror-vim';
import { createIvkExtensions } from '@/lib/cm-ivk';
import { useEnvStore } from '@/stores/env-store';
import { useEditorStore } from '@/stores/editor-store';

interface Props {
  body: string;
  onChange: (body: string) => void;
}

export function BodyTab({ body, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const vimCompartmentRef = useRef<Compartment | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const envManager = useEnvStore((s) => s.envManager);
  const vimMode = useEditorStore((s) => s.vimMode);

  // Status of the last "Format JSON" attempt. Briefly flips to
  // 'error' (or 'empty') when the JSON parse fails / nothing to
  // format, then resets to 'idle' so the button label can revert.
  const [formatStatus, setFormatStatus] = useState<'idle' | 'error' | 'empty'>('idle');

  // Create editor on mount
  useEffect(() => {
    if (!containerRef.current) return;

    // Compartment lets us swap the vim extension on/off without recreating
    // the entire EditorView (which would lose cursor position, history, etc.).
    const vimCompartment = new Compartment();
    vimCompartmentRef.current = vimCompartment;

    const view = new EditorView({
      state: EditorState.create({
        doc: body,
        extensions: [
          // Vim must come BEFORE the default keymap so its bindings win.
          vimCompartment.of(vimMode ? vim() : []),
          keymap.of([...defaultKeymap, indentWithTab]),
          lineNumbers(),
          placeholder('Start typing or paste JSON, XML, or plain text...'),
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
      vimCompartmentRef.current = null;
    };
    // Only run on mount — body changes are pushed via transactions below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [envManager]);

  // Hot-swap the vim extension when the user toggles the setting.
  useEffect(() => {
    const view = viewRef.current;
    const compartment = vimCompartmentRef.current;
    if (!view || !compartment) return;
    view.dispatch({
      effects: compartment.reconfigure(vimMode ? vim() : []),
    });
  }, [vimMode]);

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
    if (text.trim() === '') {
      // Nothing to format. Surface the empty case so users who hit
      // ⌘⇧F by reflex know the action ran (it just had nothing to
      // do); auto-resets below.
      setFormatStatus('empty');
      window.setTimeout(() => setFormatStatus('idle'), 1500);
      return;
    }
    try {
      const formatted = JSON.stringify(JSON.parse(text), null, 2);
      view.dispatch({
        changes: { from: 0, to: text.length, insert: formatted },
      });
      onChangeRef.current(formatted);
      // Clear any prior error label so a successful format doesn't
      // leave the red text behind.
      setFormatStatus('idle');
    } catch {
      // Not valid JSON. Was previously a silent ignore — users
      // pressing the button on an XML / form-data / plain-text body
      // got zero feedback and assumed the button was broken. Briefly
      // flip the label to "Invalid JSON" then reset.
      setFormatStatus('error');
      window.setTimeout(() => setFormatStatus('idle'), 1500);
    }
  }, []);

  // Listen for Cmd+Shift+F keyboard shortcut
  useEffect(() => {
    const handler = () => formatJson();
    window.addEventListener('invoker:format-json-editor', handler);
    return () => window.removeEventListener('invoker:format-json-editor', handler);
  }, [formatJson]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div ref={containerRef} style={{ flex: 1, overflow: 'auto' }} />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '4px 12px',
          boxShadow: 'inset 0 1px 0 rgba(66,71,84,0.18)',
        }}
      >
        <button
          onClick={formatJson}
          title={
            formatStatus === 'error'
              ? 'Body is not valid JSON'
              : formatStatus === 'empty'
                ? 'Nothing to format'
                : 'Format the body as JSON (⌘⇧F)'
          }
          style={{
            background: 'transparent',
            border: 'none',
            // Red while the parse error is being shown; otherwise the
            // usual subtle gray so the label doesn't compete with the
            // editor.
            color:
              formatStatus === 'error'
                ? '#e58484'
                : formatStatus === 'empty'
                  ? '#a89472'
                  : '#767575',
            fontSize: 11,
            cursor: 'pointer',
            fontFamily: "'JetBrains Mono', monospace",
            transition: 'color 0.15s',
          }}
        >
          {formatStatus === 'error'
            ? 'Invalid JSON'
            : formatStatus === 'empty'
              ? 'Nothing to format'
              : 'Format JSON'}
        </button>
      </div>
    </div>
  );
}
