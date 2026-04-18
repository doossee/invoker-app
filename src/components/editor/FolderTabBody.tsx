import { useState, useMemo } from 'react';
import { Folder, BookOpen, ExternalLink, FolderOpen, Play } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { parseIvk } from 'ivkjs';
import { useCollectionStore } from '@/stores/collection-store';
import { useDocsStore } from '@/stores/docs-store';
import { useEditorStore, type TabData } from '@/stores/editor-store';
import { useRequest } from '@/hooks/useRequest';
import { TOKENS, TabBar, Panel, MethodBadge, METHOD_PALETTE } from '@/components/shared/primitives';

interface Props {
  folderPath: string;
}

export function FolderTabBody({ folderPath }: Props) {
  const [innerTab, setInnerTab] = useState('README.md');
  const docs = useDocsStore((s) => s.docs);

  // Find README.md for this folder
  const readmePath = `${folderPath}/README.md`;
  const readmeDoc = docs.find((d) => d.path === readmePath);

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
      <div style={{ flex: 1, overflow: 'auto', padding: '28px 40px 60px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          {innerTab === 'README.md' && (
            <>
              {/* File path line */}
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  color: TOKENS.fg3,
                  marginBottom: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Folder size={12} style={{ color: TOKENS.yellow }} />
                <span>my-collection</span>
                <span style={{ color: TOKENS.fg4 }}>/</span>
                <span>{folderPath.split('/').pop()}</span>
                <span style={{ color: TOKENS.fg4 }}>/</span>
                <BookOpen size={10} />
                <span style={{ color: TOKENS.fg2 }}>README.md</span>
              </div>

              {/* Markdown content */}
              {readmeDoc ? (
                <div className="invoker-prose">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
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
                  >
                    {readmeDoc.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <div style={{ color: TOKENS.fg3, fontSize: 13 }}>
                  No README.md found in this folder.
                </div>
              )}
            </>
          )}

          {innerTab === 'Files' && (
            <FolderFiles folderPath={folderPath} />
          )}
        </div>
      </div>
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/*  Inline IvkBlock in README                                          */
/* ------------------------------------------------------------------ */
function InlineIvkBlock({ content }: { content: string }) {
  const openTab = useEditorStore((s) => s.openTab);
  const [showResponse, setShowResponse] = useState(false);
  const [viewTab, setViewTab] = useState<'request' | 'response'>('request');

  let method = 'GET';
  let url = '';
  let body: string | null = null;
  try {
    const parsed = parseIvk(content);
    method = parsed.method;
    url = parsed.url;
    body = parsed.body;
  } catch { /* ignore */ }

  const mc = METHOD_PALETTE[method] ?? { c: TOKENS.fg3, bg: 'rgba(118,117,117,0.14)' };

  const handleOpen = () => {
    const name = url.split('/').pop() ?? 'request';
    const tab: TabData = { kind: 'ivk', path: `inline-${Date.now()}`, name, method };
    openTab(tab);
  };

  return (
    <div
      style={{
        marginBottom: 18,
        borderRadius: 10,
        overflow: 'hidden',
        background: TOKENS.s2,
        boxShadow: `inset 0 0 0 1px ${TOKENS.strokeSoft}`,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 10px',
          borderBottom: `1px solid ${TOKENS.strokeSoft}`,
        }}
      >
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            fontWeight: 700,
            color: mc.c,
            letterSpacing: '0.05em',
            minWidth: 34,
          }}
        >
          {method}
        </span>
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
          {url}
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

      {/* Request/Response tabs */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          padding: '4px 8px',
          borderBottom: `1px solid ${TOKENS.strokeSoft}`,
          background: TOKENS.s2,
        }}
      >
        {(['request', 'response'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setViewTab(tab)}
            style={{
              padding: '4px 10px',
              borderRadius: 4,
              border: 'none',
              background: viewTab === tab ? TOKENS.s4 : 'transparent',
              color: viewTab === tab ? TOKENS.fg1 : TOKENS.fg3,
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 11,
              textTransform: 'capitalize',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Body */}
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
          }}
        >
          {body}
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
