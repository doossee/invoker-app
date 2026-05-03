import { useMemo, useState } from 'react';
import { ExternalLink, Play } from 'lucide-react';
import { parseIvk } from 'ivkjs';
import { resolveInlineIvk, openTabSpecForInline } from '@/lib/inline-ivk';
import { useCollectionStore } from '@/stores/collection-store';
import { useEditorStore, type TabData } from '@/stores/editor-store';
import { useRequest } from '@/hooks/useRequest';
import { useEnv } from '@/hooks/useEnv';
import { TOKENS, MethodBadge } from '@/components/shared/primitives';
import { HighlightedText } from '@/components/shared/VariableTokens';

/**
 * Runnable `ivk` codeblock embedded in markdown. Used wherever
 * `<MarkdownPreview>` / `<MarkdownLivePreview>` renders user-authored
 * docs — folder READMEs and standalone .md tabs alike.
 *
 * Two block forms are valid:
 *   - Full inline source (block contains a real .ivk request)
 *   - `path: foo/bar.ivk` referencing a file in the current collection
 *
 * Layout:
 *   ┌─────────────────────────────────────────────────────────┐
 *   │ [METHOD]  url                            [Open] [Run] │
 *   ├─────────────────────────────────────────────────────────┤
 *   │  request   response                                     │
 *   ├─────────────────────────────────────────────────────────┤
 *   │  body / response status+body                            │
 *   └─────────────────────────────────────────────────────────┘
 *
 * Run wires through `useRequest` with a stable cache key derived
 * from either the resolved sourcePath (path-reference blocks share
 * the cache slot with their standalone tab) or the inline content.
 */
export function InlineIvkBlock({ content }: { content: string }) {
  const openTab = useEditorStore((s) => s.openTab);
  const collectionFiles = useCollectionStore((s) => s.files);
  const { get: resolveVar, setVariable } = useEnv();
  const [viewTab, setViewTab] = useState<'request' | 'response'>('request');

  const resolved = resolveInlineIvk(content, collectionFiles);

  const parsed = useMemo(() => {
    if (!resolved.ok) return { error: resolved.error };
    try {
      return { request: parseIvk(resolved.content) };
    } catch (e) {
      return { error: (e as Error)?.message ?? 'failed to parse .ivk source' };
    }
  }, [resolved]);

  const method = parsed.request?.method ?? 'GET';
  const url = parsed.request?.url ?? '';
  const body = parsed.request?.body ?? null;
  const resolveError = parsed.error ?? null;

  const cacheKey = resolved.ok
    ? (resolved.sourcePath ?? `inline:${content}`)
    : null;
  const { run, loading, result } = useRequest(cacheKey);

  const handleRun = () => {
    if (!parsed.request || loading) return;
    setViewTab('response');
    void run(parsed.request);
  };

  const openSpec = openTabSpecForInline(resolved, url);
  const handleOpen = () => {
    const tab: TabData = { kind: 'ivk', path: openSpec.path, name: openSpec.name, method };
    openTab(tab);
  };

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
        {openSpec.openable && (
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
        )}
        <button
          onClick={handleRun}
          disabled={loading || !parsed.request}
          style={{
            background: TOKENS.amber,
            color: '#3a2807',
            padding: '4px 10px',
            borderRadius: 5,
            border: 'none',
            fontSize: 11,
            fontWeight: 600,
            cursor: loading ? 'wait' : 'pointer',
            opacity: loading || !parsed.request ? 0.6 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontFamily: 'inherit',
          }}
        >
          <Play size={9} />
          {loading ? 'Running…' : 'Run'}
        </button>
      </div>

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
                marginBottom: -1,
              }}
            >
              {tab}
            </button>
          );
        })}
      </div>

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
      {viewTab === 'response' && !result && !loading && (
        <div style={{ padding: '12px 14px', fontSize: 12, color: TOKENS.fg3, fontStyle: 'italic' }}>
          Press Run to see the response.
        </div>
      )}
      {viewTab === 'response' && loading && (
        <div style={{ padding: '12px 14px', fontSize: 12, color: TOKENS.fg3, fontStyle: 'italic' }}>
          Running…
        </div>
      )}
      {viewTab === 'response' && result && (
        <div style={{ padding: '12px 14px', fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>
          <div style={{ marginBottom: 8, color: TOKENS.fg2, display: 'flex', gap: 10 }}>
            <span style={{ color: result.response.error ? '#e58484' : TOKENS.amber, fontWeight: 600 }}>
              {result.response.error ? 'ERR' : `${result.response.status} OK`}
            </span>
            <span>{Math.round(result.response.time)} ms</span>
            <span>{result.response.size} B</span>
          </div>
          <pre
            style={{
              margin: 0,
              fontSize: 11.5,
              color: TOKENS.fg1,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              maxHeight: 280,
              overflow: 'auto',
              lineHeight: 1.5,
            }}
          >
            {(() => {
              if (result.response.error) return result.response.error;
              const b = result.response.body;
              if (typeof b === 'string') return b;
              try {
                return JSON.stringify(b, null, 2);
              } catch {
                return String(b);
              }
            })()}
          </pre>
        </div>
      )}
    </div>
  );
}

/**
 * Default `code` renderer for `<MarkdownPreview>` / `<MarkdownLivePreview>`:
 * substitutes `language-ivk` fenced blocks with `<InlineIvkBlock>`. Pass
 * this (or merge it) into the markdown component's `components.code`.
 */
export function ivkCodeBlockRenderer({
  className,
  children,
  ...props
}: {
  className?: string;
  children?: React.ReactNode;
} & React.HTMLAttributes<HTMLElement>) {
  const match = /language-ivk/.exec(className ?? '');
  if (match) {
    const content = String(children).trim();
    return <InlineIvkBlock content={content} />;
  }
  // Inline code (no language): styled chip.
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
  // Fenced code with a non-ivk language — leave to default styling.
  return (
    <code className={className} {...props}>
      {children}
    </code>
  );
}
