import { useState, useEffect } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { Sidebar } from '@/components/layout/Sidebar';
import { StatusBar } from '@/components/layout/StatusBar';
import { ResizablePanel } from '@/components/layout/ResizablePanel';
import { FileTree } from '@/components/collection/FileTree';
import { DocsTree } from '@/components/docs/DocsTree';
import { SidebarTabs } from '@/components/sidebar/SidebarTabs';
import { WelcomePage } from '@/components/welcome/WelcomePage';
import { RequestEditor } from '@/components/editor/RequestEditor';
import { DocRenderer } from '@/components/docs/DocRenderer';
import { EnvSettings } from '@/components/env/EnvSettings';
import { useEditorStore } from '@/stores/editor-store';
import { useCollectionStore } from '@/stores/collection-store';
import { useDocsStore } from '@/stores/docs-store';
import { useEnvStore } from '@/stores/env-store';
import { watchCollection, loadCollection, loadFromManifest } from '@/lib/file-system';
import { isPublished } from '@/lib/platform';

export function App() {
  const [envSettingsOpen, setEnvSettingsOpen] = useState(false);

  const sidebarView = useEditorStore((s) => s.sidebarView);
  const setSidebarView = useEditorStore((s) => s.setSidebarView);
  const sidebarWidth = useEditorStore((s) => s.sidebarWidth);
  const setSidebarWidth = useEditorStore((s) => s.setSidebarWidth);
  const setSiteConfig = useEditorStore((s) => s.setSiteConfig);
  const activeFilePath = useCollectionStore((s) => s.activeFilePath);
  const activeDocPath = useDocsStore((s) => s.activeDocPath);
  const collectionPath = useCollectionStore((s) => s.collectionPath);

  // Published mode: load manifest at startup
  useEffect(() => {
    if (!isPublished()) return;

    loadFromManifest().then((data) => {
      useCollectionStore.getState().loadCollection({
        ivkFiles: data.ivkFiles,
        basePath: data.basePath,
      });
      useDocsStore.getState().loadDocs(data.mdFiles);

      // Docs-first for published sites
      useEditorStore.getState().setSidebarView('docs');

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
    <div className="h-screen flex flex-col bg-bg text-text-primary overflow-hidden">
      <TopBar onOpenSettings={() => setEnvSettingsOpen(true)} />

      <div className="flex-1 flex overflow-hidden">
        <ResizablePanel width={sidebarWidth} onWidthChange={setSidebarWidth}>
          <Sidebar>
            <SidebarTabs view={sidebarView} onChange={setSidebarView} />
            {sidebarView === 'collection' ? <FileTree /> : <DocsTree />}
          </Sidebar>
        </ResizablePanel>

        <div className="flex-1 overflow-hidden">
          {sidebarView === 'docs' && activeDocPath ? (
            <DocRenderer docPath={activeDocPath} />
          ) : sidebarView === 'collection' && activeFilePath ? (
            <RequestEditor filePath={activeFilePath} />
          ) : (
            <WelcomePage />
          )}
        </div>
      </div>

      <StatusBar />

      {envSettingsOpen && (
        <EnvSettings onClose={() => setEnvSettingsOpen(false)} />
      )}
    </div>
  );
}
