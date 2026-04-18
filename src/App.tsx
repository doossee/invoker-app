import { useState, useEffect, useMemo, useCallback } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { ResizablePanel } from '@/components/layout/ResizablePanel';
import { UnifiedTree } from '@/components/collection/UnifiedTree';
import { WelcomePage } from '@/components/welcome/WelcomePage';
import { RequestEditor } from '@/components/editor/RequestEditor';
import { FolderTabBody } from '@/components/editor/FolderTabBody';
import { EditorTabs } from '@/components/editor/EditorTabs';
import { EnvSettings } from '@/components/env/EnvSettings';
import { CommandPalette } from '@/components/modals/CommandPalette';
import { SettingsModal } from '@/components/modals/SettingsModal';
import { useEditorStore } from '@/stores/editor-store';
import { useCollectionStore } from '@/stores/collection-store';
import { useEnvStore } from '@/stores/env-store';
import { watchCollection, loadCollection, loadFromManifest } from '@/lib/file-system';
import { isPublished } from '@/lib/platform';
import { useDocsStore } from '@/stores/docs-store';
import { TOKENS } from '@/components/shared/primitives';

export function App() {
  const [searchQuery, setSearchQuery] = useState('');

  const sidebarWidth = useEditorStore((s) => s.sidebarWidth);
  const setSidebarWidth = useEditorStore((s) => s.setSidebarWidth);
  const setSiteConfig = useEditorStore((s) => s.setSiteConfig);

  // Tab state
  const tabs = useEditorStore((s) => s.tabs);
  const activeTabPath = useEditorStore((s) => s.activeTabPath);
  const activeTab = tabs.find((t) => t.path === activeTabPath);

  // Modal state
  const settingsOpen = useEditorStore((s) => s.settingsOpen);
  const setSettingsOpen = useEditorStore((s) => s.setSettingsOpen);
  const envSettingsOpen = useEditorStore((s) => s.envSettingsOpen);
  const setEnvSettingsOpen = useEditorStore((s) => s.setEnvSettingsOpen);
  const commandPaletteOpen = useEditorStore((s) => s.commandPaletteOpen);
  const setCommandPaletteOpen = useEditorStore((s) => s.setCommandPaletteOpen);

  const collectionPath = useCollectionStore((s) => s.collectionPath);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;

      // ⌘K — Command palette
      if (meta && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
        return;
      }

      // ⌘Enter — Send request
      if (meta && e.key === 'Enter') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('invoker:send'));
        return;
      }

      // ⌘N — New request
      if (meta && e.key === 'n') {
        e.preventDefault();
        // TODO: create new request
        return;
      }

      // ⌘W — Close tab
      if (meta && e.key === 'w') {
        e.preventDefault();
        if (activeTabPath) {
          useEditorStore.getState().closeTab(activeTabPath);
        }
        return;
      }

      // ⌘E — Switch environment
      if (meta && e.key === 'e') {
        e.preventDefault();
        const state = useEnvStore.getState();
        const envs = state.settings.environments;
        if (envs.length > 0) {
          const next = (state.settings.activeEnvironmentIndex + 1) % envs.length;
          state.setActiveEnv(next);
        }
        return;
      }

      // ⌘⇧F — Format JSON
      if (meta && e.shiftKey && e.key === 'f') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('invoker:format-json'));
        return;
      }

      // ⌘\ — Toggle sidebar (placeholder)
      if (meta && e.key === '\\') {
        e.preventDefault();
        return;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeTabPath, commandPaletteOpen, setCommandPaletteOpen]);

  // Published mode: load manifest at startup
  useEffect(() => {
    if (!isPublished()) return;

    loadFromManifest().then((data) => {
      useCollectionStore.getState().loadCollection({
        ivkFiles: data.ivkFiles,
        basePath: data.basePath,
      });
      useDocsStore.getState().loadDocs(data.mdFiles);

      if (data.config?.defaults) {
        useEnvStore.getState().setAuthorDefaults(data.config.defaults);
      }
      setSiteConfig(data.config ?? null);
    });
  }, [setSiteConfig]);

  // Watch collection for changes
  useEffect(() => {
    if (!collectionPath) return;
    const unwatch = watchCollection(collectionPath, async () => {
      const data = await loadCollection(collectionPath);
      useCollectionStore.getState().loadCollection({ ivkFiles: data.ivkFiles, basePath: data.basePath });
      useDocsStore.getState().loadDocs(data.mdFiles);
    });
    return unwatch;
  }, [collectionPath]);

  // Determine content view
  const hasActiveTab = !!activeTab;
  const showIvk = activeTab?.kind === 'ivk';
  const showFolder = activeTab?.kind === 'folder';

  // Sync activeFilePath with collection store for backward compat
  useEffect(() => {
    if (showIvk && activeTab?.path) {
      const currentActive = useCollectionStore.getState().activeFilePath;
      if (currentActive !== activeTab.path) {
        useCollectionStore.getState().setActiveFile(activeTab.path);
      }
    }
  }, [showIvk, activeTab?.path]);

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        gap: 12,
        padding: 12,
        background: TOKENS.s1,
        color: TOKENS.fg1,
        fontFamily: "'Inter', system-ui, sans-serif",
        overflow: 'hidden',
      }}
    >
      {/* Sidebar */}
      <div style={{ flexShrink: 0, height: '100%' }}>
        <ResizablePanel width={sidebarWidth} onWidthChange={setSidebarWidth}>
          <Sidebar
            onOpenSettings={() => setSettingsOpen(true)}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          >
            <UnifiedTree searchQuery={searchQuery} />
          </Sidebar>
        </ResizablePanel>
      </div>

      {/* Main content area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          gap: 10,
        }}
      >
        {/* Editor tabs row — always visible when tabs exist */}
        {tabs.length > 0 && <EditorTabs />}

        {/* Content body */}
        {!hasActiveTab && <WelcomePage />}
        {showIvk && activeTab && <RequestEditor filePath={activeTab.path} />}
        {showFolder && activeTab && <FolderTabBody folderPath={activeTab.path} />}
      </div>

      {/* Modals */}
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
      {envSettingsOpen && <EnvSettings onClose={() => setEnvSettingsOpen(false)} />}
      {commandPaletteOpen && <CommandPalette onClose={() => setCommandPaletteOpen(false)} />}
    </div>
  );
}
