import { useState, useEffect, useMemo } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { ResizablePanel } from '@/components/layout/ResizablePanel';
import { UnifiedTree } from '@/components/collection/UnifiedTree';
import { WelcomePage } from '@/components/welcome/WelcomePage';
import { RequestEditor } from '@/components/editor/RequestEditor';
import { DocRenderer } from '@/components/docs/DocRenderer';
import { EnvSettings } from '@/components/env/EnvSettings';
import { useEditorStore } from '@/stores/editor-store';
import { useCollectionStore } from '@/stores/collection-store';
import { useDocsStore } from '@/stores/docs-store';
import { useEnvStore } from '@/stores/env-store';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { watchCollection, loadCollection, loadFromManifest } from '@/lib/file-system';
import { isPublished } from '@/lib/platform';

export function App() {
  const [envSettingsOpen, setEnvSettingsOpen] = useState(false);

  const sidebarWidth = useEditorStore((s) => s.sidebarWidth);
  const setSidebarWidth = useEditorStore((s) => s.setSidebarWidth);
  const setSiteConfig = useEditorStore((s) => s.setSiteConfig);
  const activeFilePath = useCollectionStore((s) => s.activeFilePath);
  const activeDocPath = useDocsStore((s) => s.activeDocPath);
  const collectionPath = useCollectionStore((s) => s.collectionPath);

  // Global keyboard shortcuts
  const shortcutHandlers = useMemo(() => ({
    onSend: () => {
      window.dispatchEvent(new CustomEvent('invoker:send'));
    },
    onSwitchEnv: () => {
      const state = useEnvStore.getState();
      const envs = state.settings.environments;
      if (envs.length === 0) return;
      const next = (state.settings.activeEnvironmentIndex + 1) % envs.length;
      state.setActiveEnv(next);
    },
    onFormatJson: () => {
      window.dispatchEvent(new CustomEvent('invoker:format-json'));
    },
  }), []);

  useKeyboardShortcuts(shortcutHandlers);

  // Published mode: load manifest at startup
  useEffect(() => {
    if (!isPublished()) return;

    loadFromManifest().then((data) => {
      useCollectionStore.getState().loadCollection({
        ivkFiles: data.ivkFiles,
        basePath: data.basePath,
      });
      useDocsStore.getState().loadDocs(data.mdFiles);

      // Apply author default env vars
      if (data.config?.defaults) {
        useEnvStore.getState().setAuthorDefaults(data.config.defaults);
      }

      // Store config for TopBar to read
      setSiteConfig(data.config ?? null);
    });
  }, [setSiteConfig]);

  useEffect(() => {
    if (!collectionPath) return;
    const unwatch = watchCollection(collectionPath, async () => {
      const data = await loadCollection(collectionPath);
      useCollectionStore.getState().loadCollection({ ivkFiles: data.ivkFiles, basePath: data.basePath });
      useDocsStore.getState().loadDocs(data.mdFiles);
    });
    return unwatch;
  }, [collectionPath]);

  return (
    <div className="h-screen flex flex-col bg-surface-lowest text-on-surface overflow-hidden">
      <div className="flex-1 flex overflow-hidden">
        <div className="p-3 flex-shrink-0">
          <ResizablePanel width={sidebarWidth} onWidthChange={setSidebarWidth}>
            <Sidebar onOpenSettings={() => setEnvSettingsOpen(true)}>
              <UnifiedTree />
            </Sidebar>
          </ResizablePanel>
        </div>

        <div className="flex-1 overflow-hidden">
          {activeDocPath ? (
            <DocRenderer docPath={activeDocPath} />
          ) : activeFilePath ? (
            <RequestEditor filePath={activeFilePath} />
          ) : (
            <WelcomePage />
          )}
        </div>
      </div>

      {envSettingsOpen && (
        <EnvSettings onClose={() => setEnvSettingsOpen(false)} />
      )}
    </div>
  );
}
