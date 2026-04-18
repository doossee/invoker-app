import React, { useState, useCallback, useMemo } from 'react';
import { parseIvk, type IvkRequest, type RunResult } from 'ivkjs';
import { Play, ExternalLink, Loader2, CheckCircle, XCircle, Terminal } from 'lucide-react';
import { Badge } from '@/components/shared/Badge';
import { useCollectionStore } from '@/stores/collection-store';
import { useDocsStore } from '@/stores/docs-store';
import { useRequest } from '@/hooks/useRequest';
import { useEnv } from '@/hooks/useEnv';

interface Props {
  source: string;
}

/** Parse `key: value` directives from the ivk embed source text. */
function parseDirectives(source: string): Record<string, string> {
  const directives: Record<string, string> = {};
  for (const line of source.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx > 0) {
      const key = trimmed.slice(0, colonIdx).trim();
      const value = trimmed.slice(colonIdx + 1).trim();
      directives[key] = value;
    }
  }
  return directives;
}

/** Render text with {{var}} highlighted as colored spans. */
function renderTextWithVars(
  text: string,
  getVar: (name: string) => string | undefined,
): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const re = /\{\{(\w+)\}\}/g;
  let lastIndex = 0;
  let match;
  let key = 0;
  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    const varName = match[1]!;
    const value = getVar(varName);
    const isSet = value !== undefined && value !== '';
    parts.push(
      <span key={key++} className={isSet ? 'text-var-set' : 'text-var-unset'}>
        {`{{${varName}}}`}
      </span>,
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.substring(lastIndex));
  return parts;
}

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
  if (typeof body === 'object') {
    return JSON.stringify(body, null, 2);
  }
  return String(body);
}

export function IvkBlock({ source }: Props) {
  const directives = useMemo(() => parseDirectives(source), [source]);
  const filePath = directives['path'] ?? null;

  const getFileByPath = useCollectionStore((s) => s.getFileByPath);
  const setActiveFile = useCollectionStore((s) => s.setActiveFile);
  const { get: getVar } = useEnv();

  const file = filePath ? getFileByPath(filePath) : undefined;

  const parsedRequest = useMemo<IvkRequest | null>(() => {
    if (!file) return null;
    try {
      return parseIvk(file.content);
    } catch {
      return null;
    }
  }, [file]);

  const { run, loading, result } = useRequest(filePath);
  const [localResult, setLocalResult] = useState<RunResult | null>(null);

  // Use local result if we have one (from clicking Run in this block),
  // otherwise fall back to the cached result from the editor store.
  const displayResult = localResult ?? result;

  const handleRun = useCallback(async () => {
    if (!parsedRequest || loading) return;
    const res = await run(parsedRequest);
    setLocalResult(res);
  }, [parsedRequest, loading, run]);

  const handleOpen = useCallback(() => {
    if (!filePath) return;
    setActiveFile(filePath);
    // Clear doc selection so the editor shows
    useDocsStore.getState().clearActiveDoc();
  }, [filePath, setActiveFile]);

  // Error: file not found
  if (!filePath) {
    return (
      <div className="my-3 rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-xs text-red-400">
        Invalid ivk embed: no <code className="font-mono">path:</code> directive found.
      </div>
    );
  }

  if (!file) {
    return (
      <div className="my-3 rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-xs text-red-400">
        File not found: <code className="font-mono">{filePath}</code>
      </div>
    );
  }

  if (!parsedRequest) {
    return (
      <div className="my-3 rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-xs text-red-400">
        Could not parse: <code className="font-mono">{filePath}</code>
      </div>
    );
  }

  const { method, url, headers, body } = parsedRequest;
  const name = parsedRequest.directives.name || file.name;
  const description = parsedRequest.directives.description;

  // Filter out Content-Type from displayed headers (it's obvious)
  const displayHeaders = Object.entries(headers).filter(
    ([k]) => k.toLowerCase() !== 'content-type',
  );

  const hasBody = body.trim().length > 0;

  return (
    <div className="my-4 rounded-lg ghost-border bg-surface-low overflow-hidden">
      {/* Header row: method badge + URL + name + actions */}
      <div className="flex items-center gap-2 px-4 py-3">
        <Badge type="method" value={method} />
        <span className="text-xs font-mono text-on-surface-variant truncate flex-1">
          {renderTextWithVars(url, getVar)}
        </span>
        <span className="text-xs text-outline font-medium shrink-0">{name}</span>
        <button
          onClick={handleRun}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-primary text-on-primary hover:bg-primary/90 disabled:opacity-50 transition-colors duration-150 shrink-0"
        >
          {loading ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Play size={12} />
          )}
          {loading ? '...' : 'Run'}
        </button>
        <button
          onClick={handleOpen}
          className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors duration-150 shrink-0"
        >
          <ExternalLink size={12} />
          Open
        </button>
      </div>

      {/* Description + headers + body */}
      {(description || displayHeaders.length > 0 || hasBody) && (
        <div className="px-4 pb-4 space-y-3">
          {description && (
            <p className="text-xs text-outline m-0">{description}</p>
          )}

          {displayHeaders.length > 0 && (
            <div className="space-y-0.5">
              {displayHeaders.map(([key, value]) => (
                <div key={key} className="text-[11px] font-mono text-on-surface-variant">
                  <span className="text-outline">{key}:</span>{' '}
                  {renderTextWithVars(value, getVar)}
                </div>
              ))}
            </div>
          )}

          {hasBody && (
            <pre className="bg-surface-lowest rounded-md p-3 overflow-x-auto max-h-48 overflow-y-auto text-[11px] font-mono text-on-surface-variant leading-relaxed m-0">
              {renderTextWithVars(body, getVar)}
            </pre>
          )}
        </div>
      )}

      {/* Response area */}
      {displayResult && <IvkBlockResponse result={displayResult} />}
    </div>
  );
}

/** Inline response display for the IvkBlock widget. */
function IvkBlockResponse({ result }: { result: RunResult }) {
  const { response, testResults, logs } = result;
  const passedTests = testResults.filter((t) => t.passed).length;
  const allPassed = passedTests === testResults.length;

  return (
    <div className="ghost-border-t">
      {/* Status summary */}
      <div className="flex items-center gap-3 px-4 py-2.5">
        <Badge type="status" value={response.status} />
        <span className="text-[11px] text-on-surface-variant">{response.time}ms</span>
        <span className="text-[11px] text-on-surface-variant">{formatBytes(response.size)}</span>
        {testResults.length > 0 && (
          <span
            className={`text-[11px] font-medium ${
              allPassed ? 'text-green-400' : 'text-red-400'
            }`}
          >
            Tests: {passedTests}/{testResults.length} {allPassed ? '\u2713' : '\u2717'}
          </span>
        )}
        {response.error && (
          <span className="text-[11px] text-red-400 truncate">{response.error}</span>
        )}
      </div>

      {/* Response body */}
      {response.body !== undefined && response.body !== null && (
        <pre className="px-4 py-3 text-[11px] font-mono text-on-surface-variant leading-relaxed overflow-x-auto max-h-60 overflow-y-auto bg-surface-lowest mx-4 mb-4 rounded-md">
          {formatBody(response.body)}
        </pre>
      )}

      {/* Test results */}
      {testResults.length > 0 && (
        <div className="px-4 py-3 ghost-border-t space-y-1.5">
          {testResults.map((test, idx) => (
            <div key={idx} className="flex items-start gap-1.5 text-[11px]">
              {test.passed ? (
                <CheckCircle size={12} className="text-green-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle size={12} className="text-red-400 shrink-0 mt-0.5" />
              )}
              <span className={test.passed ? 'text-on-surface-variant' : 'text-red-400'}>
                {test.name}
              </span>
              {test.error && (
                <span className="text-red-400/70 font-mono ml-1">
                  {test.error}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Console logs */}
      {logs.length > 0 && (
        <div className="px-4 py-3 ghost-border-t space-y-1">
          {logs.map((log, idx) => (
            <div key={idx} className="flex items-start gap-1.5 text-[11px] font-mono">
              <Terminal size={11} className="text-outline shrink-0 mt-0.5" />
              <span className="text-on-surface-variant">{log}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
