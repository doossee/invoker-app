import { useState, useMemo } from 'react';
import { Folder, BookOpen, ExternalLink, FolderOpen, Play } from 'lucide-react';
import { parseIvk } from 'ivkjs';
import { resolveInlineIvk } from '@/lib/inline-ivk';
import { useCollectionStore } from '@/stores/collection-store';
import { useDocsStore } from '@/stores/docs-store';
import { useEditorStore, type TabData } from '@/stores/editor-store';
import { useRequest } from '@/hooks/useRequest';
import { useEnv } from '@/hooks/useEnv';
import { TOKENS, TabBar, Panel, MethodBadge } from '@/components/shared/primitives';
import { HighlightedText } from '@/components/shared/VariableTokens';
import {
  MarkdownEditor,
  MarkdownPreview,
  ModeBar,
  useMarkdownDoc,
} from '@/components/shared/MarkdownDocView';
import { MarkdownLivePreview } from '@/components/shared/MarkdownLivePreview';

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
/*  Inline IvkBlock in README                                          */
/* ------------------------------------------------------------------ */
function InlineIvkBlock({ content }: { content: string }) {
  const openTab = useEditorStore((s) => s.openTab);
  const collectionFiles = useCollectionStore((s) => s.files);
  const { get: resolveVar, setVariable } = useEnv();
  const [showResponse, setShowResponse] = useState(false);
  const [viewTab, setViewTab] = useState<'request' | 'response'>('request');

  // Two block forms are valid:
  //   - Full inline source (block contains a real .ivk request)
  //   - `path: foo/bar.ivk` referencing a file in the current collection
  // Without this resolution, path: blocks fell through parseIvk's catch and
  // rendered "GET / No body" with an empty URL.
  const resolved = resolveInlineIvk(content, collectionFiles);

  let method = 'GET';
  let url = '';
  let body: string | null = null;
  let resolveError: string | null = null;
  if (resolved.ok) {
    try {
      const parsed = parseIvk(resolved.content);
      method = parsed.method;
      url = parsed.url;
      body = parsed.body;
    } catch (e) {
      resolveError = (e as Error)?.message ?? 'failed to parse .ivk source';
    }
  } else {
    resolveError = resolved.error;
  }

  const handleOpen = () => {
    const name = url.split('/').pop() ?? 'request';
    const tab: TabData = { kind: 'ivk', path: `inline-${Date.now()}`, name, method };
    openTab(tab);
  };

  // Show a clear error tile instead of pretending to render a "GET / No body"
  // request when path: resolution or parsing failed.
  if (resolveError) {
    return (
      <div
        style={{
          marginBottom: 18,
          padding: '10px 14px',
          borderRadius: 10,
          background: 'rgba(229, 88, 88, 0.08)',
          boxShadow: 'inset 0 0 0 1px rgba(229, 88, 88, 0.35)',
          color: '#e58484',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 12,
          lineHeight: 1.5,
        }}
      >
        <strong style={{ fontWeight: 600 }}>Inline ivk error:</strong> {resolveError}
      </div>
    );
  }

  return (
    <div
      style={{
        marginBottom: 18,
        borderRadius: 10,
        overflow: 'hidden',
        background: TOKENS.s2,
        boxShadow: `inset 0 0 0 1px ${TOKENS.stroke}`,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 10px',
          borderBottom: `1px solid ${TOKENS.stroke}`,
        }}
      >
        <MethodBadge method={method} />
        <span
          style={{
            flex: 1,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 12,
            color: TOKENS.fg1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          <HighlightedText text={url} resolver={resolveVar} onChangeVar={setVariable} />
        </span>
        <button
          onClick={handleOpen}
          style={{
            background: 'transparent',
            color: TOKENS.fg2,
            padding: '4px 9px',
            borderRadius: 5,
            boxShadow: `inset 0 0 0 1px ${TOKENS.stroke}`,
            border: 'none',
            fontSize: 11,
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontFamily: 'inherit',
          }}
        >
          <ExternalLink size={10} />
          Open
        </button>
        <button
          onClick={() => setShowResponse(true)}
          style={{
            background: TOKENS.amber,
            color: '#3a2807',
            padding: '4px 10px',
            borderRadius: 5,
            border: 'none',
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontFamily: 'inherit',
          }}
        >
          <Play size={9} />
          Run
        </button>
      </div>

      {/* Request/Response tabs — underline-on-active pattern so the row
          reads as a sub-header of the card, not a floating button group. */}
      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          gap: 0,
          padding: '0 10px',
          borderBottom: `1px solid ${TOKENS.strokeSoft}`,
        }}
      >
        {(['request', 'response'] as const).map((tab) => {
          const isActive = viewTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setViewTab(tab)}
              style={{
                padding: '7px 10px',
                border: 'none',
                background: 'transparent',
                color: isActive ? TOKENS.fg1 : TOKENS.fg3,
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 11,
                fontWeight: isActive ? 600 : 500,
                textTransform: 'capitalize',
                borderBottom: isActive ? `1.5px solid ${TOKENS.amber}` : '1.5px solid transparent',
                // Overlap the container's bottom border so the active underline
                // visually sits ON the divider line, not above it.
                marginBottom: -1,
              }}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Body — {{variables}} are highlighted and open a floating popover
          on hover for inspection + inline editing. */}
      {viewTab === 'request' && body && (
        <pre
          style={{
            margin: 0,
            padding: '12px 14px',
            fontSize: 12.5,
            fontFamily: "'JetBrains Mono', monospace",
            color: TOKENS.fg1,
            lineHeight: 1.6,
            background: 'transparent',
            whiteSpace: 'pre-wrap',
          }}
        >
          <HighlightedText text={body} resolver={resolveVar} onChangeVar={setVariable} />
        </pre>
      )}
      {viewTab === 'request' && !body && (
        <div style={{ padding: '12px 14px', fontSize: 12, color: TOKENS.fg3, fontStyle: 'italic' }}>
          No body
        </div>
      )}
      {viewTab === 'response' && (
        <div style={{ padding: '12px 14px', fontSize: 12, color: TOKENS.fg3, fontStyle: 'italic' }}>
          Press Run to see the response.
        </div>
      )}
    </div>
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
