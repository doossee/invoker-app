import { useState } from 'react';
import { Loader2, CheckCircle, XCircle, Terminal } from 'lucide-react';
import { Badge } from '@/components/shared/Badge';
import type { RunResult } from 'ivkjs';

interface Props {
  result: RunResult | null;
  loading: boolean;
}

type ResponseTab = 'body' | 'headers' | 'tests' | 'console';

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

export function ResponsePanel({ result, loading }: Props) {
  const [activeTab, setActiveTab] = useState<ResponseTab>('body');

  // Empty state
  if (!result && !loading) {
    return (
      <div className="flex items-center justify-center py-8 text-outline text-xs">
        Click Send to execute the request
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-on-surface-variant text-xs">
        <Loader2 size={14} className="animate-spin" />
        Sending...
      </div>
    );
  }

  if (!result) return null;

  const { response, testResults, logs } = result;
  const passedTests = testResults.filter((t) => t.passed).length;
  const hasHeaders = response.headers && Object.keys(response.headers).length > 0;
  const hasTests = testResults.length > 0;
  const hasLogs = logs.length > 0;

  const tabs: { key: ResponseTab; label: string; show: boolean }[] = [
    { key: 'body', label: 'Body', show: true },
    { key: 'headers', label: 'Headers', show: !!hasHeaders },
    { key: 'tests', label: `Tests (${passedTests}/${testResults.length})`, show: hasTests },
    { key: 'console', label: `Console (${logs.length})`, show: hasLogs },
  ];

  return (
    <div className="flex flex-col overflow-hidden">
      {/* Status bar */}
      <div className="flex items-center gap-3 px-3 py-2 ghost-border-b bg-surface">
        <Badge type="status" value={response.status} />
        <span className="text-xs text-on-surface-variant">{response.time}ms</span>
        <span className="text-xs text-on-surface-variant">{formatBytes(response.size)}</span>
        {hasTests && (
          <span
            className={`text-xs font-medium ${
              passedTests === testResults.length ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {passedTests}/{testResults.length} passed
          </span>
        )}
        {response.error && (
          <span className="text-xs text-red-400 truncate">{response.error}</span>
        )}
      </div>

      {/* Response tab bar */}
      <div className="flex items-center ghost-border-b px-3">
        {tabs
          .filter((t) => t.show)
          .map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors relative ${
                activeTab === tab.key
                  ? 'text-primary'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {tab.label}
              {activeTab === tab.key && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'body' && (
          <pre className="p-3 text-xs font-mono text-on-surface whitespace-pre-wrap break-words leading-relaxed">
            {formatBody(response.body)}
          </pre>
        )}

        {activeTab === 'headers' && hasHeaders && (
          <div className="p-3 space-y-1">
            {Object.entries(response.headers).map(([key, value]) => (
              <div key={key} className="flex gap-2 text-xs font-mono">
                <span className="text-primary shrink-0">{key}:</span>
                <span className="text-on-surface break-all">{value}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'tests' && hasTests && (
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

        {activeTab === 'console' && hasLogs && (
          <div className="p-3 space-y-0.5">
            {logs.map((log, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs font-mono">
                <Terminal size={12} className="text-outline shrink-0 mt-0.5" />
                <span className="text-on-surface-variant">{log}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
