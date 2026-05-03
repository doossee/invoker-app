import { useState, useMemo, useCallback, useEffect } from 'react';
import { Save, Check } from 'lucide-react';
import { parseIvk, serializeIvk, type IvkRequest, type HttpMethod } from 'ivkjs';
import { useCollectionStore } from '@/stores/collection-store';
import { useEditorStore } from '@/stores/editor-store';
import { useRequest } from '@/hooks/useRequest';
import {
  TOKENS,
  Panel,
  TabBar,
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

/* ================================================================== */
/*  Main RequestEditor                                                 */
/* ================================================================== */
export function RequestEditor({ filePath }: Props) {
  const getFileByPath = useCollectionStore((s) => s.getFileByPath);
  const saveRequest = useCollectionStore((s) => s.saveRequest);

  const requestTab = useEditorStore((s) => s.requestTab) as RequestTabName;
  const setRequestTab = useEditorStore((s) => s.setRequestTab);
  const splitDirection = useEditorStore((s) => s.splitDirection);
  const setSplitDirection = useEditorStore((s) => s.setSplitDirection);
  const setCommandPaletteOpen = useEditorStore((s) => s.setCommandPaletteOpen);
  const markDirty = useEditorStore((s) => s.markDirty);
  const updateTab = useEditorStore((s) => s.updateTab);
  // Read the dirty flag from the tab so the Save button only lights up when
  // there's something to save. `tabs` is subscribed so this re-renders when
  // markDirty flips the flag.
  const isDirty = useEditorStore((s) => s.tabs.find((t) => t.path === filePath)?.dirty ?? false);

  const [justSaved, setJustSaved] = useState(false);

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

  const handleSave = useCallback(async () => {
    if (!request) return;
    const content = serializeIvk(request);
    try {
      await saveRequest(filePath, content);
      markDirty(filePath, false);
      setJustSaved(true);
      window.setTimeout(() => setJustSaved(false), 1500);
    } catch (e) {
      // Surface a minimal error so the user knows the disk write failed.
      // We keep the in-memory state so their edits aren't lost.
      console.error('Save failed:', e);
    }
  }, [request, filePath, saveRequest, markDirty]);

  useEffect(() => {
    const onSend = () => {
      if (request && !loading) run(request);
    };
    const onFormatJson = () => {
      window.dispatchEvent(new CustomEvent('invoker:format-json-editor'));
    };
    // Only the currently-active editor's save listener should respond. Since
    // we guard on request being non-null (tab closed = editor unmounted),
    // this naturally only fires for the mounted request editor.
    const onSave = () => {
      handleSave();
    };
    window.addEventListener('invoker:send', onSend);
    window.addEventListener('invoker:format-json', onFormatJson);
    window.addEventListener('invoker:save', onSave);
    return () => {
      window.removeEventListener('invoker:send', onSend);
      window.removeEventListener('invoker:format-json', onFormatJson);
      window.removeEventListener('invoker:save', onSave);
    };
  }, [request, loading, run, handleSave]);

  // Every field-change handler marks the tab dirty so the Save button lights
  // up and the tab shows a dot until the user commits via ⌘S or the button.
  const touch = useCallback(() => markDirty(filePath, true), [markDirty, filePath]);

  const handleMethodChange = useCallback((method: HttpMethod) => {
    setRequest((prev) => (prev ? { ...prev, method } : prev));
    // Live-sync the tab's badge so the tab header reflects the change
    // immediately (not only after save). Sidebar updates via file.content
    // changes — which only happens on save, intentionally.
    updateTab(filePath, { method });
    touch();
  }, [touch, updateTab, filePath]);

  const handleUrlChange = useCallback((url: string) => {
    setRequest((prev) => (prev ? { ...prev, url } : prev));
    touch();
  }, [touch]);

  const handleHeadersChange = useCallback((headers: Record<string, string>) => {
    setRequest((prev) => (prev ? { ...prev, headers } : prev));
    touch();
  }, [touch]);

  const handleBodyChange = useCallback((body: string) => {
    setRequest((prev) => (prev ? { ...prev, body } : prev));
    touch();
  }, [touch]);

  const handleAuthChange = useCallback((auth: string) => {
    setRequest((prev) =>
      prev ? { ...prev, directives: { ...prev.directives, auth } } : prev,
    );
    touch();
  }, [touch]);

  const handleScriptsChange = useCallback(
    (scripts: { pre: string; post: string; test: string }) => {
      setRequest((prev) => (prev ? { ...prev, scripts } : prev));
      touch();
    },
    [touch],
  );

  const handleDirectivesChange = useCallback(
    (directives: NonNullable<IvkRequest>['directives']) => {
      setRequest((prev) => (prev ? { ...prev, directives } : prev));
      // `@name` is the display name for the tab, so reflect any change live.
      if (directives.name) updateTab(filePath, { name: directives.name });
      touch();
    },
    [touch, updateTab, filePath],
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <Breadcrumb parts={breadcrumbParts} />
          <button
            onClick={handleSave}
            disabled={!isDirty && !justSaved}
            title={isDirty ? 'Save changes (⌘S)' : justSaved ? 'Saved' : 'No unsaved changes'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '3px 8px',
              background: isDirty ? 'rgba(230,193,136,0.12)' : 'transparent',
              boxShadow: `inset 0 0 0 1px ${isDirty ? TOKENS.strokeHot : TOKENS.strokeSoft}`,
              color: justSaved ? TOKENS.green : isDirty ? TOKENS.amber : TOKENS.fg3,
              border: 'none',
              borderRadius: 5,
              fontSize: 10,
              fontWeight: 600,
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              cursor: isDirty ? 'pointer' : 'default',
              opacity: isDirty || justSaved ? 1 : 0.55,
            }}
          >
            {justSaved ? <Check size={10} /> : <Save size={10} />}
            {justSaved ? 'Saved' : 'Save'}
          </button>
        </div>
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
