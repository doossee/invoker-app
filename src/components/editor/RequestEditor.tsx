import { useState, useMemo, useCallback } from 'react';
import { parseIvk, type IvkRequest, type HttpMethod } from 'ivkjs';
import { useCollectionStore } from '@/stores/collection-store';
import { useEditorStore } from '@/stores/editor-store';
import { useRequest } from '@/hooks/useRequest';
import { UrlBar } from './UrlBar';
import { HeadersTab } from './HeadersTab';
import { BodyTab } from './BodyTab';
import { AuthTab } from './AuthTab';
import { ScriptsTab } from './ScriptsTab';
import { VarsTab } from './VarsTab';
import { ParamsTab } from './ParamsTab';

interface Props {
  filePath: string;
}

const TABS = ['Headers', 'Body', 'Auth', 'Scripts', 'Vars', 'Params'] as const;
type TabName = (typeof TABS)[number];

export function RequestEditor({ filePath }: Props) {
  const getFileByPath = useCollectionStore((s) => s.getFileByPath);
  const activeTab = useEditorStore((s) => s.activeTab) as TabName;
  const setActiveTab = useEditorStore((s) => s.setActiveTab);

  const file = getFileByPath(filePath);

  // Parse the file content into an IvkRequest
  const initialRequest = useMemo(() => {
    if (!file) return null;
    try {
      return parseIvk(file.content);
    } catch {
      return null;
    }
  }, [file]);

  const [request, setRequest] = useState<IvkRequest | null>(initialRequest);

  // Keep request in sync when file changes (e.g. switching files)
  const [prevPath, setPrevPath] = useState(filePath);
  if (filePath !== prevPath) {
    setPrevPath(filePath);
    if (file) {
      try {
        setRequest(parseIvk(file.content));
      } catch {
        setRequest(null);
      }
    }
  }

  const { run, loading, result } = useRequest(filePath);

  const handleSend = useCallback(async () => {
    if (!request || loading) return;
    await run(request);
  }, [request, loading, run]);

  const handleMethodChange = useCallback((method: HttpMethod) => {
    setRequest((prev) => prev ? { ...prev, method } : prev);
  }, []);

  const handleUrlChange = useCallback((url: string) => {
    setRequest((prev) => prev ? { ...prev, url } : prev);
  }, []);

  const handleHeadersChange = useCallback((headers: Record<string, string>) => {
    setRequest((prev) => prev ? { ...prev, headers } : prev);
  }, []);

  const handleBodyChange = useCallback((body: string) => {
    setRequest((prev) => prev ? { ...prev, body } : prev);
  }, []);

  const handleAuthChange = useCallback((auth: string) => {
    setRequest((prev) =>
      prev ? { ...prev, directives: { ...prev.directives, auth } } : prev,
    );
  }, []);

  const handleScriptsChange = useCallback(
    (scripts: { pre: string; post: string; test: string }) => {
      setRequest((prev) => prev ? { ...prev, scripts } : prev);
    },
    [],
  );

  const handleDirectivesChange = useCallback(
    (directives: typeof request extends null ? never : NonNullable<typeof request>['directives']) => {
      setRequest((prev) => prev ? { ...prev, directives } : prev);
    },
    [],
  );

  if (!request) {
    return (
      <div className="h-full flex items-center justify-center text-text-muted text-sm">
        Could not parse request file.
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* URL Bar */}
      <UrlBar
        method={request.method}
        url={request.url}
        onMethodChange={handleMethodChange}
        onUrlChange={handleUrlChange}
        onSend={handleSend}
        loading={loading}
      />

      {/* Tab Bar */}
      <div className="flex items-center border-b border-border px-3">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-2 text-xs font-medium transition-colors relative ${
              activeTab === tab
                ? 'text-accent'
                : 'text-text-dim hover:text-text-primary'
            }`}
          >
            {tab}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'Headers' && (
          <HeadersTab headers={request.headers} onChange={handleHeadersChange} />
        )}
        {activeTab === 'Body' && (
          <BodyTab body={request.body} onChange={handleBodyChange} />
        )}
        {activeTab === 'Auth' && (
          <AuthTab auth={request.directives.auth} onChange={handleAuthChange} />
        )}
        {activeTab === 'Scripts' && (
          <ScriptsTab scripts={request.scripts} onChange={handleScriptsChange} />
        )}
        {activeTab === 'Vars' && <VarsTab request={request} />}
        {activeTab === 'Params' && (
          <ParamsTab directives={request.directives} onChange={handleDirectivesChange} />
        )}
      </div>

      {/* Response Panel — placeholder until Task 8 */}
      {result && (
        <div className="border-t border-border p-3 text-xs text-text-dim">
          Response: {result.response.status} ({result.response.time}ms)
        </div>
      )}
    </div>
  );
}
