import { useState } from 'react';
import { Loader2, CheckCircle, XCircle, Terminal } from 'lucide-react';
import type { RunResult } from 'ivkjs';

interface Props {
  result: RunResult | null;
  loading: boolean;
}

type ResponseTab = 'Body' | 'Headers' | 'Tests' | 'Console';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatBody(body: unknown): string {
  if (body === null || body === undefined) return '';
  if (typeof body === 'string') {
    // Try to parse and re-format as JSON
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

function statusColor(code: number): { color: string; bg: string } {
  if (code === 0) return { color: 'var(--ivk-error)', bg: 'rgba(249,119,88,0.12)' };
  if (code < 300) return { color: 'var(--ivk-success)', bg: 'rgba(74,225,118,0.12)' };
  if (code < 400) return { color: 'var(--ivk-primary)', bg: 'rgba(230,193,136,0.12)' };
  return { color: 'var(--ivk-error)', bg: 'rgba(249,119,88,0.12)' };
}

function StatusBadge({ status, time, size }: { status: number; time: number; size: number }) {
  const { color, bg } = statusColor(status);
  return (
    <div className="flex items-center gap-3 pr-3 font-mono text-[11px]">
      <span
        className="px-[7px] py-[2px] rounded font-semibold"
        style={{ color, background: bg }}
      >
        {status === 0 ? 'ERR' : `${status} OK`}
      </span>
      <span className="text-outline">{time} ms</span>
      <span className="text-outline">{formatBytes(size)}</span>
    </div>
  );
}

export function ResponsePanel({ result, loading }: Props) {
  const [activeTab, setActiveTab] = useState<ResponseTab>('Body');

  const hasResult = !!result && !loading;
  const response = result?.response;
  const testResults = result?.testResults ?? [];
  const logs = result?.logs ?? [];
  const hasHeaders = response?.headers && Object.keys(response.headers).length > 0;
  const hasTests = testResults.length > 0;
  const hasLogs = logs.length > 0;
  const passedTests = testResults.filter((t) => t.passed).length;

  const tabs: { key: ResponseTab; label: string; show: boolean }[] = [
    { key: 'Body', label: 'Body', show: true },
    { key: 'Headers', label: 'Headers', show: true },
    { key: 'Tests', label: hasTests ? `Tests (${passedTests}/${testResults.length})` : 'Tests', show: true },
    { key: 'Console', label: hasLogs ? `Console (${logs.length})` : 'Console', show: true },
  ];

  return (
    <>
      {/* Tab bar */}
      <div
        className="flex items-center h-[34px] shrink-0"
        style={{ boxShadow: 'inset 0 -1px 0 rgba(66,71,84,0.18)' }}
      >
        <div className="flex flex-1 pl-2">
          {tabs
            .filter((t) => t.show)
            .map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="px-3 h-[34px] bg-transparent border-none cursor-pointer text-xs font-medium relative"
                style={{
                  fontFamily: 'inherit',
                  color: activeTab === tab.key ? 'var(--ivk-primary)' : 'var(--ivk-on-surface-variant)',
                }}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <span
                    className="absolute bottom-[-1px] left-[10px] right-[10px] h-0.5 rounded-sm"
                    style={{ background: 'var(--ivk-primary)' }}
                  />
                )}
              </button>
            ))}
        </div>
        {hasResult && response && (
          <StatusBadge status={response.status} time={response.time} size={response.size} />
        )}
      </div>

      {/* Empty state */}
      {!result && !loading && (
        <div className="flex-1 flex items-center justify-center text-outline text-xs">
          Click Send to execute the request
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex-1 flex items-center justify-center gap-2 text-on-surface-variant text-xs">
          <Loader2 size={14} className="animate-spin" />
          Sending...
        </div>
      )}

      {/* Tab content */}
      {hasResult && response && (
        <div className="flex-1 overflow-auto">
          {activeTab === 'Body' && (
            <pre className="p-3 text-xs font-mono text-on-surface whitespace-pre-wrap break-words leading-relaxed m-0">
              {formatBody(response.body)}
            </pre>
          )}

          {activeTab === 'Headers' && hasHeaders && (
            <div className="p-3 space-y-1">
              {Object.entries(response.headers).map(([key, value]) => (
                <div key={key} className="flex gap-2 text-xs font-mono">
                  <span className="text-primary shrink-0">{key}:</span>
                  <span className="text-on-surface break-all">{value}</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'Headers' && !hasHeaders && (
            <div className="p-3 text-xs text-outline italic">No headers in response.</div>
          )}

          {activeTab === 'Tests' && hasTests && (
            <div className="p-3 space-y-1.5">
              {testResults.map((test, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs">
                  {test.passed ? (
                    <CheckCircle size={14} className="text-green-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className={test.passed ? 'text-on-surface' : 'text-red-400'}>
                      {test.name}
                    </span>
                    {test.error && (
                      <div className="text-red-400/80 mt-0.5 font-mono text-[11px]">
                        {test.error}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'Tests' && !hasTests && (
            <div className="p-3 text-xs text-outline italic">No tests defined.</div>
          )}

          {activeTab === 'Console' && hasLogs && (
            <div className="p-3 space-y-0.5">
              {logs.map((log, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs font-mono">
                  <Terminal size={12} className="text-outline shrink-0 mt-0.5" />
                  <span className="text-on-surface-variant">{log}</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'Console' && !hasLogs && (
            <div className="p-3 text-xs text-outline italic">No console output.</div>
          )}
        </div>
      )}
    </>
  );
}
