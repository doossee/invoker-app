import { useState, useMemo, useCallback, useEffect } from 'react';
import { Search, Clock } from 'lucide-react';
import { parseIvk, type IvkRequest, type HttpMethod } from 'ivkjs';
import { useCollectionStore } from '@/stores/collection-store';
import { useEditorStore } from '@/stores/editor-store';
import { useRequest } from '@/hooks/useRequest';
import {
  TOKENS,
  Panel,
  TabBar,
  SplitToggle,
  IconBtn,
} from '@/components/shared/primitives';
import { UrlBar } from './UrlBar';
import { HeadersTab } from './HeadersTab';
import { BodyTab } from './BodyTab';
import { AuthTab } from './AuthTab';
import { ScriptsTab } from './ScriptsTab';
import { VarsTab } from './VarsTab';
import { ParamsTab } from './ParamsTab';
import { ResponsePanel } from './ResponsePanel';
import { Breadcrumb } from './Breadcrumb';

interface Props {
  filePath: string;
}

const REQUEST_TABS = ['Body', 'Headers', 'Auth', 'Scripts', 'Vars', 'Params'] as const;
type RequestTabName = (typeof REQUEST_TABS)[number];

/* ------------------------------------------------------------------ */
/*  Body type pill                                                     */
/* ------------------------------------------------------------------ */
function BodyTypePill({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const types = ['json', 'raw', 'form-data', 'binary', 'graphql'];
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      fontSize: 10,
      fontFamily: "'JetBrains Mono', monospace",
      paddingRight: 8,
      flexShrink: 0,
    }}>
      {types.map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          style={{
            padding: '3px 6px',
            borderRadius: 4,
            background: value === t ? TOKENS.s5 : 'transparent',
            color: value === t ? TOKENS.amber : TOKENS.fg3,
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: 10,
            fontWeight: 500,
            whiteSpace: 'nowrap',
          }}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

/* ================================================================== */
/*  Main RequestEditor                                                 */
/* ================================================================== */
export function RequestEditor({ filePath }: Props) {
  const getFileByPath = useCollectionStore((s) => s.getFileByPath);

  const requestTab = useEditorStore((s) => s.requestTab) as RequestTabName;
  const setRequestTab = useEditorStore((s) => s.setRequestTab);
  const splitDirection = useEditorStore((s) => s.splitDirection);
  const setSplitDirection = useEditorStore((s) => s.setSplitDirection);
  const setCommandPaletteOpen = useEditorStore((s) => s.setCommandPaletteOpen);

  const [bodyType, setBodyType] = useState('json');

  const file = getFileByPath(filePath);

  // Parse the file content
  const initialRequest = useMemo(() => {
    if (!file) return null;
    try {
      return parseIvk(file.content);
    } catch {
      return null;
    }
  }, [file]);

  const [request, setRequest] = useState<IvkRequest | null>(initialRequest);

  // Keep request in sync when file changes
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

  useEffect(() => {
    const onSend = () => {
      if (request && !loading) run(request);
    };
    const onFormatJson = () => {
      window.dispatchEvent(new CustomEvent('invoker:format-json-editor'));
    };
    window.addEventListener('invoker:send', onSend);
    window.addEventListener('invoker:format-json', onFormatJson);
    return () => {
      window.removeEventListener('invoker:send', onSend);
      window.removeEventListener('invoker:format-json', onFormatJson);
    };
  }, [request, loading, run]);

  const handleMethodChange = useCallback((method: HttpMethod) => {
    setRequest((prev) => (prev ? { ...prev, method } : prev));
  }, []);

  const handleUrlChange = useCallback((url: string) => {
    setRequest((prev) => (prev ? { ...prev, url } : prev));
  }, []);

  const handleHeadersChange = useCallback((headers: Record<string, string>) => {
    setRequest((prev) => (prev ? { ...prev, headers } : prev));
  }, []);

  const handleBodyChange = useCallback((body: string) => {
    setRequest((prev) => (prev ? { ...prev, body } : prev));
  }, []);

  const handleAuthChange = useCallback((auth: string) => {
    setRequest((prev) =>
      prev ? { ...prev, directives: { ...prev.directives, auth } } : prev,
    );
  }, []);

  const handleScriptsChange = useCallback(
    (scripts: { pre: string; post: string; test: string }) => {
      setRequest((prev) => (prev ? { ...prev, scripts } : prev));
    },
    [],
  );

  const handleDirectivesChange = useCallback(
    (directives: NonNullable<IvkRequest>['directives']) => {
      setRequest((prev) => (prev ? { ...prev, directives } : prev));
    },
    [],
  );

  // Breadcrumb parts
  const breadcrumbParts = useMemo(() => {
    const parts = filePath.split('/');
    return ['My Collection', ...parts];
  }, [filePath]);

  if (!request) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: TOKENS.fg3, fontSize: 14 }}>
        Could not parse request file.
      </div>
    );
  }

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        minHeight: 0,
        overflow: 'hidden',
        gap: 8,
      }}
    >
      {/* Breadcrumb + URL bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
        <Breadcrumb parts={breadcrumbParts} />
        <UrlBar
          method={request.method}
          url={request.url}
          onMethodChange={handleMethodChange}
          onUrlChange={handleUrlChange}
          onSend={handleSend}
          loading={loading}
        />
      </div>

      {/* Split: Request + Response */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          minHeight: 0,
          flexDirection: splitDirection === 'horizontal' ? 'row' : 'column',
          gap: 10,
        }}
      >
        {/* Request panel */}
        <Panel style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, minWidth: 0, overflow: 'hidden' }}>
          <TabBar
            tabs={REQUEST_TABS}
            active={requestTab}
            onChange={setRequestTab}
            right={
              requestTab === 'Body' ? (
                <BodyTypePill value={bodyType} onChange={setBodyType} />
              ) : undefined
            }
          />
          <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
            {requestTab === 'Body' && <BodyTab body={request.body} onChange={handleBodyChange} />}
            {requestTab === 'Headers' && <HeadersTab headers={request.headers} onChange={handleHeadersChange} />}
            {requestTab === 'Auth' && <AuthTab auth={request.directives.auth} onChange={handleAuthChange} />}
            {requestTab === 'Scripts' && <ScriptsTab scripts={request.scripts} onChange={handleScriptsChange} />}
            {requestTab === 'Vars' && <VarsTab request={request} />}
            {requestTab === 'Params' && <ParamsTab directives={request.directives} onChange={handleDirectivesChange} />}
          </div>
        </Panel>

        {/* Response panel */}
        <Panel style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, minWidth: 0, overflow: 'hidden' }}>
          <ResponsePanel result={result} loading={loading} />
        </Panel>
      </div>
    </div>
  );
}
