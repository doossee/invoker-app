import { useMemo, useState } from 'react';
import { Folder, BookOpen, FolderOpen } from 'lucide-react';
import { parseIvk } from 'ivkjs';
import { useCollectionStore } from '@/stores/collection-store';
import { useDocsStore } from '@/stores/docs-store';
import { useEditorStore, type TabData } from '@/stores/editor-store';
import { TOKENS, TabBar, Panel, MethodBadge } from '@/components/shared/primitives';
import {
  MarkdownEditor,
  MarkdownPreview,
  ModeBar,
  useMarkdownDoc,
} from '@/components/shared/MarkdownDocView';
import { MarkdownLivePreview } from '@/components/shared/MarkdownLivePreview';
import { InlineIvkBlock } from '@/components/shared/InlineIvkBlock';

interface Props {
  folderPath: string;
}

export function FolderTabBody({ folderPath }: Props) {
  const [innerTab, setInnerTab] = useState('README.md');
  const docs = useDocsStore((s) => s.docs);

  // Find README.md for this folder (case-insensitive)
  const readmeDoc = docs.find((d) => {
    const lower = d.path.toLowerCase();
    return lower === `${folderPath.toLowerCase()}/readme.md`;
  });

  return (
    <Panel style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, minWidth: 0 }}>
      {/* Inner tab bar */}
      <TabBar
        tabs={['README.md', 'Files']}
        active={innerTab}
        onChange={setInnerTab}
        right={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingRight: 10 }}>
            <span
              style={{
                fontSize: 9,
                color: TOKENS.fg3,
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              Folder docs
            </span>
          </div>
        }
      />

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
        {innerTab === 'README.md' && <ReadmeView folderPath={folderPath} readmeDoc={readmeDoc} />}
        {innerTab === 'Files' && (
          <div style={{ flex: 1, overflow: 'auto', padding: '28px 40px 60px' }}>
            <div style={{ maxWidth: 680, margin: '0 auto' }}>
              <FolderFiles folderPath={folderPath} />
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/*  README view — Preview / Edit toggle                                */
/* ------------------------------------------------------------------ */
function ReadmeView({
  folderPath,
  readmeDoc,
}: {
  folderPath: string;
  readmeDoc: { path: string; content: string } | undefined;
}) {
  const saveDoc = useDocsStore((s) => s.saveDoc);
  const collectionPath = useCollectionStore((s) => s.collectionPath);
  const markDirty = useEditorStore((s) => s.markDirty);

  // README path: use the doc's actual path if found; otherwise default to
  // `<folder>/README.md` so a save creates the file at the conventional spot.
  const readmePath = readmeDoc?.path ?? `${folderPath}/README.md`;
  const initialContent = readmeDoc?.content ?? '';

  const { mode, setMode, draft, setDraft, dirty } = useMarkdownDoc({
    // Dirty/save scoped to the FOLDER tab (the open tab is the folder, not
    // the README itself), so the folder's tab dot reflects unsaved README
    // edits. ⌘S still routes to whichever tab is mounted.
    path: folderPath,
    initialContent,
    onSave: (content) => saveDoc(readmePath, content, collectionPath),
    markDirty,
  });

  return (
    <>
      <ModeBar
        mode={mode}
        setMode={setMode}
        dirty={dirty}
        left={
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              color: TOKENS.fg3,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Folder size={12} style={{ color: TOKENS.yellow }} />
            <span>{folderPath.split('/').pop()}</span>
            <span style={{ color: TOKENS.fg4 }}>/</span>
            <BookOpen size={10} />
            <span style={{ color: TOKENS.fg2 }}>README.md</span>
          </div>
        }
      />
      {mode === 'preview' && (
        <div style={{ flex: 1, overflow: 'auto', padding: '28px 40px 60px' }}>
          <div style={{ maxWidth: 680, margin: '0 auto' }}>
            {readmeDoc || draft ? (
              <MarkdownPreview
                content={draft || readmeDoc?.content || ''}
                components={{
                  code({ className, children, ...props }) {
                    const match = /language-ivk/.exec(className ?? '');
                    if (match) {
                      const content = String(children).trim();
                      return <InlineIvkBlock content={content} />;
                    }
                    // Inline code
                    if (!className) {
                      return (
                        <code
                          style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: 12.5,
                            background: TOKENS.s3,
                            padding: '1px 6px',
                            borderRadius: 4,
                            color: TOKENS.amber,
                            boxShadow: `inset 0 0 0 1px ${TOKENS.strokeSoft}`,
                          }}
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    }
                    return <code className={className} {...props}>{children}</code>;
                  },
                }}
              />
            ) : (
              <div style={{ color: TOKENS.fg3, fontSize: 13 }}>
                No README.md in this folder yet — switch to Edit and start typing to create one.
              </div>
            )}
          </div>
        </div>
      )}
      {mode === 'edit' && (
        <div style={{ flex: 1, overflow: 'auto' }}>
          <MarkdownEditor value={draft} onChange={setDraft} />
        </div>
      )}
      {mode === 'live' && (
        <div style={{ flex: 1, overflow: 'auto' }}>
          <MarkdownLivePreview
            value={draft}
            onChange={setDraft}
            components={{
              code({ className, children, ...props }) {
                const match = /language-ivk/.exec(className ?? '');
                if (match) {
                  const content = String(children).trim();
                  return <InlineIvkBlock content={content} />;
                }
                if (!className) {
                  return (
                    <code
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 12.5,
                        background: TOKENS.s3,
                        padding: '1px 6px',
                        borderRadius: 4,
                        color: TOKENS.amber,
                        boxShadow: `inset 0 0 0 1px ${TOKENS.strokeSoft}`,
                      }}
                      {...props}
                    >
                      {children}
                    </code>
                  );
                }
                return <code className={className} {...props}>{children}</code>;
              },
            }}
          />
        </div>
      )}
    </>
  );
}


/* ------------------------------------------------------------------ */
/*  Folder Files list                                                  */
/* ------------------------------------------------------------------ */
function FolderFiles({ folderPath }: { folderPath: string }) {
  const files = useCollectionStore((s) => s.files);
  const openTab = useEditorStore((s) => s.openTab);

  const folderFiles = useMemo(() => {
    return files.filter((f) => f.path.startsWith(folderPath + '/') && !f.path.substring(folderPath.length + 1).includes('/'));
  }, [files, folderPath]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {folderFiles.map((f) => {
        let method = 'GET';
        try { method = parseIvk(f.content).method; } catch { /* ignore */ }
        const name = f.path.split('/').pop()?.replace('.ivk', '') ?? f.path;

        return (
          <button
            key={f.path}
            onClick={() => {
              const tab: TabData = { kind: 'ivk', path: f.path, name, method };
              openTab(tab);
              useCollectionStore.getState().setActiveFile(f.path);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 8px',
              background: 'transparent',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              color: TOKENS.fg1,
              fontFamily: 'inherit',
              fontSize: 13,
              textAlign: 'left',
            }}
          >
            <MethodBadge method={method} compact />
            <span>{name}</span>
          </button>
        );
      })}
      {folderFiles.length === 0 && (
        <div style={{ color: TOKENS.fg3, fontSize: 12 }}>No files in this folder.</div>
      )}
    </div>
  );
}
