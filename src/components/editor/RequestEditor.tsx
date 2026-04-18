import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  Plus,
  X,
  Search,
  Clock,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
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

const REQUEST_TABS = ['Body', 'Params', 'Headers', 'Auth', 'Scripts', 'Vars'] as const;
type RequestTabName = (typeof REQUEST_TABS)[number];

/* ------------------------------------------------------------------ */
/*  Method badge (compact, for editor tabs)                            */
/* ------------------------------------------------------------------ */
const METHOD_PALETTE: Record<string, { c: string; bg: string }> = {
  GET:    { c: 'var(--ivk-method-get)',    bg: 'rgba(74,225,118,0.14)' },
  POST:   { c: 'var(--ivk-method-post)',   bg: 'rgba(230,193,136,0.15)' },
  PUT:    { c: 'var(--ivk-method-put)',     bg: 'rgba(219,195,161,0.14)' },
  PATCH:  { c: 'var(--ivk-method-patch)',   bg: 'rgba(255,205,179,0.14)' },
  DELETE: { c: 'var(--ivk-method-delete)',  bg: 'rgba(249,119,88,0.14)' },
};

function MethodBadge({ method }: { method: string }) {
  const s = METHOD_PALETTE[method] ?? { c: 'var(--ivk-outline)', bg: 'rgba(118,117,117,0.14)' };
  const label = method === 'DELETE' ? 'DEL' : method;
  return (
    <span
      className="font-mono text-[9px] font-bold tracking-wider rounded-[3px] shrink-0 inline-flex items-center justify-center"
      style={{
        padding: '1px 4px',
        color: s.c,
        background: s.bg,
        minWidth: 26,
      }}
    >
      {label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Split toggle                                                       */
/* ------------------------------------------------------------------ */
function SplitToggle({
  value,
  onChange,
}: {
  value: 'horizontal' | 'vertical';
  onChange: (v: 'horizontal' | 'vertical') => void;
}) {
  return (
    <div
      className="flex gap-0 bg-surface-container rounded-md overflow-hidden"
      style={{ boxShadow: 'inset 0 0 0 1px rgba(66,71,84,0.18)' }}
    >
      <button
        onClick={() => onChange('horizontal')}
        title="Side by side"
        className="w-7 h-7 border-none flex items-center justify-center cursor-pointer"
        style={{
          background: value === 'horizontal' ? 'var(--ivk-surface-highest)' : 'transparent',
          color: value === 'horizontal' ? 'var(--ivk-primary)' : 'var(--ivk-outline)',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="1" y="2" width="5" height="10" rx="1" stroke="currentColor" strokeWidth="1.2" />
          <rect x="8" y="2" width="5" height="10" rx="1" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      </button>
      <button
        onClick={() => onChange('vertical')}
        title="Stacked"
        className="w-7 h-7 border-none flex items-center justify-center cursor-pointer"
        style={{
          background: value === 'vertical' ? 'var(--ivk-surface-highest)' : 'transparent',
          color: value === 'vertical' ? 'var(--ivk-primary)' : 'var(--ivk-outline)',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="2" y="1" width="10" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
          <rect x="2" y="8" width="10" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Icon button                                                        */
/* ------------------------------------------------------------------ */
function IconBtn({ children, tip, onClick }: { children: React.ReactNode; tip: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      title={tip}
      className="w-7 h-7 flex items-center justify-center bg-transparent border-none rounded-md text-on-surface-variant cursor-pointer hover:text-on-surface"
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Panel wrapper                                                      */
/* ------------------------------------------------------------------ */
function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`bg-surface-low rounded-xl overflow-hidden ${className}`}
      style={{ boxShadow: 'inset 0 0 0 1px rgba(66,71,84,0.28)' }}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab bar                                                            */
/* ------------------------------------------------------------------ */
function TabBar({
  tabs,
  active,
  onChange,
  right,
}: {
  tabs: readonly string[];
  active: string;
  onChange: (tab: string) => void;
  right?: React.ReactNode;
}) {
  return (
    <div
      className="flex items-center h-[34px] shrink-0"
      style={{ boxShadow: 'inset 0 -1px 0 rgba(66,71,84,0.18)' }}
    >
      <div className="flex flex-1 pl-2">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => onChange(t)}
            className="px-3 h-[34px] bg-transparent border-none cursor-pointer text-xs font-medium relative"
            style={{
              fontFamily: 'inherit',
              color: active === t ? 'var(--ivk-primary)' : 'var(--ivk-on-surface-variant)',
            }}
          >
            {t}
            {active === t && (
              <span
                className="absolute bottom-[-1px] left-[10px] right-[10px] h-0.5 rounded-sm"
                style={{ background: 'var(--ivk-primary)' }}
              />
            )}
          </button>
        ))}
      </div>
      {right}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Body type pill (json, raw, form-data, binary, graphql)             */
/* ------------------------------------------------------------------ */
function BodyTypePill({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const types = ['json', 'raw', 'form-data', 'binary', 'graphql'];
  return (
    <div className="flex items-center gap-1 text-[10px] font-mono pr-2">
      {types.map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className="px-[7px] py-[3px] rounded border-none cursor-pointer font-mono text-[10px] font-medium"
          style={{
            background: value === t ? 'var(--ivk-surface-highest)' : 'transparent',
            color: value === t ? 'var(--ivk-primary)' : 'var(--ivk-outline)',
            fontFamily: 'inherit',
          }}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Breadcrumb                                                         */
/* ------------------------------------------------------------------ */
function Breadcrumb({ parts }: { parts: string[] }) {
  return (
    <div className="flex items-center gap-1.5 text-[11px] text-outline font-mono">
      {parts.map((p, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <span style={{ color: i === parts.length - 1 ? 'var(--ivk-on-surface)' : undefined }}>
            {p}
          </span>
          {i < parts.length - 1 && (
            <ChevronRight size={10} className="text-outline-variant" />
          )}
        </span>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Editor tab (for the top row of open files)                         */
/* ------------------------------------------------------------------ */
function EditorFileTab({
  name,
  method,
  active,
  dirty,
  onClick,
  onClose,
}: {
  name: string;
  method?: string;
  active: boolean;
  dirty?: boolean;
  onClick: () => void;
  onClose: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-[7px] h-7 px-2.5 rounded-md cursor-pointer max-w-[180px]"
      style={{
        background: active ? 'var(--ivk-surface-container)' : 'transparent',
        color: active ? 'var(--ivk-on-surface)' : 'var(--ivk-on-surface-variant)',
        boxShadow: active ? 'inset 0 0 0 1px rgba(66,71,84,0.28)' : 'none',
      }}
    >
      {method ? (
        <MethodBadge method={method} />
      ) : (
        <BookOpen size={11} className="text-outline shrink-0" />
      )}
      <span className="text-xs flex-1 overflow-hidden text-ellipsis whitespace-nowrap">{name}</span>
      {dirty && (
        <span className="w-[5px] h-[5px] rounded-full bg-primary shrink-0" />
      )}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="w-4 h-4 flex items-center justify-center bg-transparent border-none rounded-[3px] text-outline cursor-pointer shrink-0"
        style={{ opacity: active ? 1 : 0.5 }}
      >
        <X size={10} />
      </button>
    </div>
  );
}

/* ================================================================== */
/*  Main RequestEditor                                                 */
/* ================================================================== */
export function RequestEditor({ filePath }: Props) {
  const getFileByPath = useCollectionStore((s) => s.getFileByPath);
  const files = useCollectionStore((s) => s.files);
  const activeFilePath = useCollectionStore((s) => s.activeFilePath);
  const setActiveFile = useCollectionStore((s) => s.setActiveFile);

  const activeTab = useEditorStore((s) => s.activeTab) as RequestTabName;
  const setActiveTab = useEditorStore((s) => s.setActiveTab);
  const splitDirection = useEditorStore((s) => s.splitDirection);
  const setSplitDirection = useEditorStore((s) => s.setSplitDirection);

  const [bodyType, setBodyType] = useState('json');

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

  // Listen for global keyboard shortcut events
  useEffect(() => {
    const onSend = () => {
      if (request && !loading) {
        run(request);
      }
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

  // Build editor tab list from the currently active file's sibling .ivk files
  const editorTabs = useMemo(() => {
    return files.slice(0, 8).map((f) => {
      let method: string | undefined;
      try {
        method = parseIvk(f.content).method;
      } catch {
        /* ignore */
      }
      const parts = f.path.split('/');
      const name = parts[parts.length - 1]?.replace('.ivk', '') ?? f.path;
      return { path: f.path, name, method, dirty: f.path === filePath };
    });
  }, [files, filePath]);

  // Build breadcrumb parts from file path
  const breadcrumbParts = useMemo(() => {
    const parts = filePath.split('/');
    return ['My Collection', ...parts];
  }, [filePath]);

  if (!request) {
    return (
      <div className="h-full flex items-center justify-center text-outline text-sm">
        Could not parse request file.
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden gap-2.5 p-3 pt-0">
      {/* ============ Editor tabs row ============ */}
      <div className="flex items-center gap-1 h-[34px] shrink-0">
        <div className="flex gap-0.5 flex-1 min-w-0 overflow-hidden">
          {editorTabs.map((t) => (
            <EditorFileTab
              key={t.path}
              name={t.name}
              method={t.method}
              active={t.path === filePath}
              dirty={t.dirty}
              onClick={() => setActiveFile(t.path)}
              onClose={() => {
                /* close tab placeholder */
              }}
            />
          ))}
          <button
            className="flex items-center justify-center w-7 h-7 bg-transparent border-none rounded-md text-outline cursor-pointer ml-0.5 hover:text-on-surface"
            title="New tab"
          >
            <Plus size={14} />
          </button>
        </div>
        <div className="flex gap-1 shrink-0">
          <SplitToggle value={splitDirection} onChange={setSplitDirection} />
          <IconBtn tip="Command palette"><Search size={14} /></IconBtn>
          <IconBtn tip="History"><Clock size={14} /></IconBtn>
        </div>
      </div>

      {/* ============ Breadcrumb ============ */}
      <Breadcrumb parts={breadcrumbParts} />

      {/* ============ URL Bar ============ */}
      <UrlBar
        method={request.method}
        url={request.url}
        onMethodChange={handleMethodChange}
        onUrlChange={handleUrlChange}
        onSend={handleSend}
        loading={loading}
      />

      {/* ============ Split: Request + Response ============ */}
      <div
        className="flex-1 flex min-h-0 gap-2.5"
        style={{
          flexDirection: splitDirection === 'horizontal' ? 'row' : 'column',
        }}
      >
        {/* Request panel */}
        <Panel className="flex-1 flex flex-col min-h-0 min-w-0">
          <TabBar
            tabs={REQUEST_TABS}
            active={activeTab}
            onChange={(t) => setActiveTab(t)}
            right={
              activeTab === 'Body' ? (
                <BodyTypePill value={bodyType} onChange={setBodyType} />
              ) : undefined
            }
          />
          <div className="flex-1 overflow-auto">
            {activeTab === 'Body' && (
              <BodyTab body={request.body} onChange={handleBodyChange} />
            )}
            {activeTab === 'Headers' && (
              <HeadersTab headers={request.headers} onChange={handleHeadersChange} />
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
        </Panel>

        {/* Response panel */}
        <Panel className="flex-1 flex flex-col min-h-0 min-w-0">
          <ResponsePanel result={result} loading={loading} />
        </Panel>
      </div>
    </div>
  );
}
