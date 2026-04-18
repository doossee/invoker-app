import { Loader2, Check, X, Cookie, Copy, Search } from 'lucide-react';
import type { RunResult } from 'ivkjs';
import { useEditorStore } from '@/stores/editor-store';
import { TOKENS, TabBar } from '@/components/shared/primitives';

interface Props {
  result: RunResult | null;
  loading: boolean;
}

const RESPONSE_TABS = ['Body', 'Headers', 'Cookies', 'Tests', 'Timeline', 'Console'] as const;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatBody(body: unknown): string {
  if (body === null || body === undefined) return '';
  if (typeof body === 'string') {
    try {
      return JSON.stringify(JSON.parse(body), null, 2);
    } catch {
      return body;
    }
  }
  if (typeof body === 'object') return JSON.stringify(body, null, 2);
  return String(body);
}

function rawBody(body: unknown): string {
  if (body === null || body === undefined) return '';
  if (typeof body === 'string') return body;
  if (typeof body === 'object') return JSON.stringify(body);
  return String(body);
}

function statusColor(code: number) {
  if (code === 0) return { color: TOKENS.red, bg: 'rgba(249,119,88,0.12)' };
  if (code < 300) return { color: TOKENS.green, bg: 'rgba(74,225,118,0.12)' };
  if (code < 400) return { color: TOKENS.amber, bg: 'rgba(230,193,136,0.12)' };
  return { color: TOKENS.red, bg: 'rgba(249,119,88,0.12)' };
}

function statusText(code: number) {
  if (code === 0) return 'ERR';
  const texts: Record<number, string> = { 200: 'OK', 201: 'Created', 204: 'No Content', 301: 'Moved', 302: 'Found', 400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden', 404: 'Not Found', 500: 'Server Error' };
  return `${code} ${texts[code] ?? ''}`.trim();
}

/* ------------------------------------------------------------------ */
/*  ResponseMeta                                                       */
/* ------------------------------------------------------------------ */
function ResponseMeta({ status, time, size }: { status: number; time: number; size: number }) {
  const { color, bg } = statusColor(status);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        paddingRight: 12,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
      }}
    >
      <span style={{ color, background: bg, padding: '2px 7px', borderRadius: 4, fontWeight: 600 }}>
        {statusText(status)}
      </span>
      <span style={{ color: TOKENS.fg3 }}>{time} ms</span>
      <span style={{ color: TOKENS.fg3 }}>{formatBytes(size)}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ViewModePill                                                       */
/* ------------------------------------------------------------------ */
function ViewModePill({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 10px',
        borderBottom: `1px solid ${TOKENS.strokeSoft}`,
        background: 'transparent',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: 2,
          background: TOKENS.s3,
          borderRadius: 6,
          boxShadow: `inset 0 0 0 1px ${TOKENS.strokeSoft}`,
          padding: 2,
        }}
      >
        {['Pretty', 'Raw', 'Table'].map((m) => (
          <button
            key={m}
            onClick={() => onChange(m.toLowerCase())}
            style={{
              padding: '3px 10px',
              border: 'none',
              borderRadius: 4,
              background: value === m.toLowerCase() ? TOKENS.s5 : 'transparent',
              color: value === m.toLowerCase() ? TOKENS.amber : TOKENS.fg3,
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 11,
              fontWeight: 500,
            }}
          >
            {m}
          </button>
        ))}
      </div>
      <div style={{ flex: 1 }} />
      <span style={{ fontSize: 10, color: TOKENS.fg3, fontFamily: "'JetBrains Mono', monospace" }}>
        application/json
      </span>
      <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: TOKENS.fg3, display: 'flex' }}>
        <Copy size={12} />
      </button>
      <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: TOKENS.fg3, display: 'flex' }}>
        <Search size={12} />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Syntax-highlighted JSON lines                                      */
/* ------------------------------------------------------------------ */
function JsonLines({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 13,
        overflow: 'auto',
        padding: '12px 0',
      }}
    >
      <div
        style={{
          padding: '0 12px',
          color: TOKENS.fg4,
          textAlign: 'right' as const,
          userSelect: 'none' as const,
          minWidth: 36,
          lineHeight: 1.6,
        }}
      >
        {lines.map((_, i) => (
          <div key={i}>{i + 1}</div>
        ))}
      </div>
      <div style={{ flex: 1, lineHeight: 1.6, paddingRight: 16 }}>
        {lines.map((line, i) => (
          <div key={i}>
            <CodeLine text={line} />
          </div>
        ))}
      </div>
    </div>
  );
}

function CodeLine({ text }: { text: string }) {
  // Simple JSON syntax coloring
  const colored = text.replace(
    /("(?:[^"\\]|\\.)*")\s*:/g,
    (_, key) => `<k>${key}</k>:`,
  );

  const parts: { text: string; color: string }[] = [];
  let remaining = text;

  // Simple tokenization
  const tokens: { text: string; color: string }[] = [];
  let i = 0;
  while (i < remaining.length) {
    const ch = remaining[i];
    if (ch === '"') {
      // Check if this is a key (followed by :)
      const end = remaining.indexOf('"', i + 1);
      if (end !== -1) {
        const str = remaining.substring(i, end + 1);
        const after = remaining.substring(end + 1).trimStart();
        if (after.startsWith(':')) {
          tokens.push({ text: str, color: TOKENS.fg2 });
        } else {
          tokens.push({ text: str, color: '#a3d6a7' });
        }
        i = end + 1;
        continue;
      }
    }
    if (ch === '{' || ch === '}' || ch === '[' || ch === ']') {
      tokens.push({ text: ch, color: TOKENS.fg2 });
      i++;
      continue;
    }
    if (ch === ':' || ch === ',') {
      tokens.push({ text: ch, color: ch === ',' ? TOKENS.fg3 : TOKENS.fg2 });
      i++;
      continue;
    }
    // Numbers
    if (/[0-9-]/.test(ch)) {
      let num = '';
      while (i < remaining.length && /[0-9.eE\-+]/.test(remaining[i])) {
        num += remaining[i];
        i++;
      }
      tokens.push({ text: num, color: TOKENS.blue });
      continue;
    }
    // true/false/null
    for (const kw of ['true', 'false', 'null']) {
      if (remaining.substring(i).startsWith(kw)) {
        tokens.push({ text: kw, color: TOKENS.amberDim });
        i += kw.length;
        continue;
      }
    }
    // Variable tokens
    if (remaining.substring(i, i + 2) === '{{') {
      const end = remaining.indexOf('}}', i + 2);
      if (end !== -1) {
        tokens.push({ text: remaining.substring(i, end + 2), color: TOKENS.amber });
        i = end + 2;
        continue;
      }
    }
    tokens.push({ text: ch, color: TOKENS.fg1 });
    i++;
  }

  return (
    <>
      {tokens.map((t, idx) => (
        <span key={idx} style={{ color: t.color }}>
          {t.text}
        </span>
      ))}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Table View                                                         */
/* ------------------------------------------------------------------ */
function TableView({ data }: { data: unknown }) {
  // Try to extract an array from the data
  let rows: Record<string, unknown>[] = [];
  if (Array.isArray(data)) {
    rows = data;
  } else if (data && typeof data === 'object') {
    // Look for a nested array (common in JSON-RPC: result.data or result)
    const obj = data as Record<string, unknown>;
    for (const key of ['result', 'data', 'items', 'rows', 'records']) {
      if (Array.isArray(obj[key])) {
        rows = obj[key] as Record<string, unknown>[];
        break;
      }
      if (obj[key] && typeof obj[key] === 'object') {
        const nested = obj[key] as Record<string, unknown>;
        for (const nk of ['data', 'items', 'rows']) {
          if (Array.isArray(nested[nk])) {
            rows = nested[nk] as Record<string, unknown>[];
            break;
          }
        }
        if (rows.length > 0) break;
      }
    }
    if (rows.length === 0) {
      rows = [obj];
    }
  }

  if (rows.length === 0) {
    return (
      <div style={{ padding: 24, color: TOKENS.fg3, fontSize: 12, textAlign: 'center' }}>
        Response is not a tabular shape.
      </div>
    );
  }

  const columns = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));

  return (
    <div style={{ flex: 1, overflow: 'auto' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse' as const,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 12,
        }}
      >
        <thead style={{ background: TOKENS.s3, color: TOKENS.fg3, letterSpacing: '0.04em' }}>
          <tr>
            <th
              style={{
                textAlign: 'left',
                padding: '8px 10px',
                fontSize: 10,
                fontWeight: 600,
                textTransform: 'uppercase' as const,
                borderBottom: `1px solid ${TOKENS.strokeSoft}`,
                width: 28,
              }}
            >
              #
            </th>
            {columns.map((col) => (
              <th
                key={col}
                style={{
                  textAlign: 'left',
                  padding: '8px 10px',
                  fontSize: 10,
                  fontWeight: 600,
                  textTransform: 'uppercase' as const,
                  borderBottom: `1px solid ${TOKENS.strokeSoft}`,
                }}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: `1px solid ${TOKENS.strokeSoft}` }}>
              <td style={{ padding: '7px 10px', verticalAlign: 'top', color: TOKENS.fg4 }}>{i + 1}</td>
              {columns.map((col) => (
                <td key={col} style={{ padding: '7px 10px', verticalAlign: 'top' }}>
                  <CellValue value={row[col]} column={col} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div
        style={{
          padding: '8px 14px',
          fontSize: 10,
          color: TOKENS.fg4,
          fontFamily: "'JetBrains Mono', monospace",
          borderTop: `1px solid ${TOKENS.strokeSoft}`,
        }}
      >
        {rows.length} rows
      </div>
    </div>
  );
}

function CellValue({ value, column }: { value: unknown; column: string }) {
  if (value === null || value === undefined) {
    return <span style={{ color: TOKENS.fg4, fontStyle: 'italic' }}>null</span>;
  }
  if (column === 'role' && typeof value === 'string') {
    const isAdmin = value === 'admin';
    return (
      <span
        style={{
          padding: '1px 7px',
          borderRadius: 3,
          fontSize: 10,
          fontWeight: 600,
          color: isAdmin ? TOKENS.amber : TOKENS.fg2,
          background: isAdmin ? 'rgba(230,193,136,0.15)' : TOKENS.s3,
        }}
      >
        {value}
      </span>
    );
  }
  if (typeof value === 'object') return <span style={{ color: TOKENS.fg3 }}>{JSON.stringify(value)}</span>;
  return <span style={{ color: TOKENS.fg1 }}>{String(value)}</span>;
}

/* ------------------------------------------------------------------ */
/*  Headers Tab                                                        */
/* ------------------------------------------------------------------ */
function HeadersView({ headers }: { headers: Record<string, string> }) {
  const entries = Object.entries(headers);
  if (entries.length === 0) {
    return <div style={{ padding: 24, color: TOKENS.fg3, fontSize: 12, textAlign: 'center' }}>No headers in response.</div>;
  }
  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '4px 0', fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
      {entries.map(([key, value], i) => (
        <div
          key={key}
          style={{
            display: 'grid',
            gridTemplateColumns: '220px 1fr',
            gap: 16,
            padding: '6px 14px',
            borderBottom: i < entries.length - 1 ? `1px solid ${TOKENS.strokeSoft}` : 'none',
          }}
        >
          <span style={{ color: TOKENS.fg3 }}>{key}</span>
          <span style={{ color: TOKENS.fg1, wordBreak: 'break-all' }}>{value}</span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Cookies Tab (Empty State)                                          */
/* ------------------------------------------------------------------ */
function CookiesView() {
  return (
    <div
      style={{
        flex: 1,
        padding: 24,
        color: TOKENS.fg3,
        fontSize: 12,
        textAlign: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column' as const,
      }}
    >
      <Cookie size={24} style={{ color: TOKENS.fg4, marginBottom: 10 }} />
      <div style={{ fontSize: 13, color: TOKENS.fg2, marginBottom: 4 }}>No cookies set</div>
      <div style={{ fontSize: 11 }}>This response did not set any cookies.</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tests Tab                                                          */
/* ------------------------------------------------------------------ */
function TestsView({ tests }: { tests: Array<{ name: string; passed: boolean; error?: string }> }) {
  if (tests.length === 0) {
    return <div style={{ padding: 24, color: TOKENS.fg3, fontSize: 12, textAlign: 'center' }}>No tests defined.</div>;
  }

  const passed = tests.filter((t) => t.passed).length;
  const failed = tests.length - passed;

  return (
    <div style={{ flex: 1, overflow: 'auto' }}>
      {/* Summary */}
      <div
        style={{
          padding: '8px 14px',
          fontSize: 11,
          color: TOKENS.fg3,
          fontFamily: "'JetBrains Mono', monospace",
          borderBottom: `1px solid ${TOKENS.strokeSoft}`,
          display: 'flex',
          gap: 12,
        }}
      >
        <span style={{ color: TOKENS.green, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Check size={10} /> {passed} passed
        </span>
        {failed > 0 && (
          <span style={{ color: TOKENS.red, display: 'flex', alignItems: 'center', gap: 4 }}>
            <X size={10} /> {failed} failed
          </span>
        )}
      </div>

      {/* Test rows */}
      {tests.map((test, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            padding: '8px 14px',
            borderBottom: i < tests.length - 1 ? `1px solid ${TOKENS.strokeSoft}` : 'none',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 12,
          }}
        >
          <span
            style={{
              width: 14,
              height: 14,
              borderRadius: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 1,
              flexShrink: 0,
              background: test.passed ? 'rgba(74,225,118,0.15)' : 'rgba(249,119,88,0.15)',
              color: test.passed ? TOKENS.green : TOKENS.red,
            }}
          >
            {test.passed ? <Check size={8} /> : <X size={8} />}
          </span>
          <div>
            <span style={{ color: test.passed ? TOKENS.fg1 : TOKENS.red }}>{test.name}</span>
            {test.error && (
              <div style={{ color: TOKENS.fg3, fontSize: 11, marginTop: 2 }}>{test.error}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Timeline Tab                                                       */
/* ------------------------------------------------------------------ */
function TimelineView({ time }: { time: number }) {
  // Generate mock phases based on total time
  const phases = [
    { label: 'DNS lookup', pct: 4, color: '#60a5fa' },
    { label: 'TCP connect', pct: 12, color: '#7dd3fc' },
    { label: 'TLS handshake', pct: 31, color: '#a78bfa' },
    { label: 'Request sent', pct: 1, color: TOKENS.amber },
    { label: 'Server waiting', pct: 41, color: TOKENS.amberDim },
    { label: 'Content download', pct: 11, color: TOKENS.green },
  ];

  return (
    <div
      style={{
        flex: 1,
        padding: '16px 18px',
        overflow: 'auto',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
      }}
    >
      <div style={{ color: TOKENS.fg3, marginBottom: 14 }}>Total {time} ms</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {phases.map((phase) => {
          const ms = Math.round((phase.pct / 100) * time);
          return (
            <div key={phase.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: TOKENS.fg2 }}>{phase.label}</span>
                <span style={{ color: TOKENS.fg3 }}>{ms} ms</span>
              </div>
              <div style={{ height: 6, background: TOKENS.s3, borderRadius: 3, overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${phase.pct}%`,
                    height: '100%',
                    background: phase.color,
                    borderRadius: 3,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Console Tab                                                        */
/* ------------------------------------------------------------------ */
function ConsoleView({ logs }: { logs: string[] }) {
  if (logs.length === 0) {
    return <div style={{ padding: 24, color: TOKENS.fg3, fontSize: 12, textAlign: 'center' }}>No console output.</div>;
  }

  return (
    <div
      style={{
        flex: 1,
        overflow: 'auto',
        padding: '10px 14px',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 12,
        lineHeight: 1.7,
      }}
    >
      {logs.map((log, i) => {
        const tag = detectLogTag(log);
        return (
          <div key={i} style={{ display: 'flex', gap: 8, color: tag === 'fail' ? TOKENS.red : TOKENS.fg1 }}>
            <span style={{ width: 42, flexShrink: 0, color: tagColor(tag) }}>{tag}</span>
            <span>{log}</span>
          </div>
        );
      })}
    </div>
  );
}

function detectLogTag(log: string): string {
  const lower = log.toLowerCase();
  if (lower.includes('fail') || lower.includes('error')) return 'fail';
  if (lower.includes('warn')) return 'warn';
  if (lower.includes('ok') || lower.includes('pass')) return 'ok';
  return 'log';
}

function tagColor(tag: string): string {
  switch (tag) {
    case 'fail': return TOKENS.red;
    case 'warn': return TOKENS.amber;
    case 'ok': return TOKENS.green;
    default: return TOKENS.fg3;
  }
}

/* ================================================================== */
/*  Main ResponsePanel                                                 */
/* ================================================================== */
export function ResponsePanel({ result, loading }: Props) {
  const responseTab = useEditorStore((s) => s.responseTab);
  const setResponseTab = useEditorStore((s) => s.setResponseTab);
  const bodyViewMode = useEditorStore((s) => s.bodyViewMode);
  const setBodyViewMode = useEditorStore((s) => s.setBodyViewMode);

  const hasResult = !!result && !loading;
  const response = result?.response;
  const testResults = result?.testResults ?? [];
  const logs = result?.logs ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Tab bar */}
      <TabBar
        tabs={RESPONSE_TABS}
        active={responseTab}
        onChange={setResponseTab}
        right={
          hasResult && response ? (
            <ResponseMeta status={response.status} time={response.time} size={response.size} />
          ) : undefined
        }
      />

      {/* Empty state */}
      {!result && !loading && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: TOKENS.fg3, fontSize: 12 }}>
          Click Send to execute the request
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: TOKENS.fg2, fontSize: 12 }}>
          <Loader2 size={14} className="animate-spin" />
          Sending...
        </div>
      )}

      {/* Tab content */}
      {hasResult && response && (
        <>
          {responseTab === 'Body' && (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              <ViewModePill value={bodyViewMode} onChange={(v) => setBodyViewMode(v as 'pretty' | 'raw' | 'table')} />
              {bodyViewMode === 'pretty' && <JsonLines text={formatBody(response.body)} />}
              {bodyViewMode === 'raw' && (
                <div
                  style={{
                    flex: 1,
                    paddingLeft: 14,
                    paddingRight: 14,
                    paddingTop: 12,
                    wordBreak: 'break-all',
                    whiteSpace: 'pre-wrap',
                    color: TOKENS.fg1,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 13,
                    lineHeight: 1.6,
                    overflow: 'auto',
                  }}
                >
                  {rawBody(response.body)}
                </div>
              )}
              {bodyViewMode === 'table' && <TableView data={response.body} />}
            </div>
          )}

          {responseTab === 'Headers' && (
            <HeadersView headers={response.headers ?? {}} />
          )}

          {responseTab === 'Cookies' && <CookiesView />}

          {responseTab === 'Tests' && <TestsView tests={testResults} />}

          {responseTab === 'Timeline' && <TimelineView time={response.time} />}

          {responseTab === 'Console' && <ConsoleView logs={logs} />}
        </>
      )}
    </div>
  );
}
