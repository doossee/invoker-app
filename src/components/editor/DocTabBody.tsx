import { FileText } from 'lucide-react';
import { useDocsStore } from '@/stores/docs-store';
import { useCollectionStore } from '@/stores/collection-store';
import { useEditorStore } from '@/stores/editor-store';
import { TOKENS, Panel } from '@/components/shared/primitives';
import {
  MarkdownEditor,
  MarkdownPreview,
  ModeBar,
  useMarkdownDoc,
} from '@/components/shared/MarkdownDocView';
import { MarkdownLivePreview } from '@/components/shared/MarkdownLivePreview';

interface Props {
  docPath: string;
}

/**
 * Standalone `.md` document editor. Edit/Preview toggle, dirty tracking, and
 * ⌘S routing are handled by the shared `useMarkdownDoc` hook so this view
 * and FolderTabBody's README share one implementation.
 */
export function DocTabBody({ docPath }: Props) {
  const docs = useDocsStore((s) => s.docs);
  const saveDoc = useDocsStore((s) => s.saveDoc);
  const collectionPath = useCollectionStore((s) => s.collectionPath);
  const markDirty = useEditorStore((s) => s.markDirty);

  const doc = docs.find((d) => d.path === docPath);
  const initialContent = doc?.content ?? '';

  const { mode, setMode, draft, setDraft, dirty } = useMarkdownDoc({
    path: docPath,
    initialContent,
    onSave: (content) => saveDoc(docPath, content, collectionPath),
    markDirty,
  });

  return (
    <Panel style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, minWidth: 0 }}>
      <ModeBar
        mode={mode}
        setMode={setMode}
        dirty={dirty}
        left={
          <>
            <FileText size={11} style={{ color: 'rgba(96,165,250,0.75)' }} />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: TOKENS.fg2 }}>
              {docPath}
            </span>
          </>
        }
      />
      <div style={{ flex: 1, overflow: 'auto' }}>
        {mode === 'preview' && (
          <div style={{ padding: '28px 40px 60px' }}>
            <div style={{ maxWidth: 680, margin: '0 auto' }}>
              {draft ? (
                <MarkdownPreview content={draft} />
              ) : (
                <div style={{ color: TOKENS.fg3, fontSize: 13 }}>
                  Empty document: {docPath}
                </div>
              )}
            </div>
          </div>
        )}
        {mode === 'edit' && <MarkdownEditor value={draft} onChange={setDraft} />}
        {mode === 'live' && <MarkdownLivePreview value={draft} onChange={setDraft} />}
      </div>
    </Panel>
  );
}
