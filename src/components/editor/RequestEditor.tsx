import { useState, useMemo, useCallback, useRef } from 'react';
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
import { ResponsePanel } from './ResponsePanel';

interface Props {
  filePath: string;
}

const TABS = ['Headers', 'Body', 'Auth', 'Scripts', 'Vars', 'Params'] as const;
type TabName = (typeof TABS)[number];

export function RequestEditor({ filePath }: Props) {
  const getFileByPath = useCollectionStore((s) => s.getFileByPath);
  const activeTab = useEditorStore((s) => s.activeTab) as TabName;
  const setActiveTab = useEditorStore((s) => s.setActiveTab);
  const responseHeight = useEditorStore((s) => s.responseHeight);
  const setResponseHeight = useEditorStore((s) => s.setResponseHeight);
  const isDraggingResize = useRef(false);

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

  const onResizeMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isDraggingResize.current = true;
      const startY = e.clientY;
      const startHeight = responseHeight;

      const onMouseMove = (ev: MouseEvent) => {
        if (!isDraggingResize.current) return;
        const delta = startY - ev.clientY;
        const newHeight = Math.max(100, Math.min(600, startHeight + delta));
        setResponseHeight(newHeight);
      };

      const onMouseUp = () => {
        isDraggingResize.current = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    },
    [responseHeight, setResponseHeight],
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

      {/* Response Panel with resize handle */}
      <div
        className="h-1 cursor-row-resize hover:bg-accent/30 transition-colors flex-shrink-0 border-t border-border"
        onMouseDown={onResizeMouseDown}
      />
      <div className="flex-shrink-0 overflow-hidden" style={{ height: responseHeight }}>
        <ResponsePanel result={result} loading={loading} />
      </div>
    </div>
  );
}
