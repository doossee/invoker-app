import { useState } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { Sidebar } from '@/components/layout/Sidebar';
import { StatusBar } from '@/components/layout/StatusBar';
import { ResizablePanel } from '@/components/layout/ResizablePanel';
import { FileTree } from '@/components/collection/FileTree';
import { DocsTree } from '@/components/docs/DocsTree';
import { SidebarTabs } from '@/components/sidebar/SidebarTabs';
import { WelcomePage } from '@/components/welcome/WelcomePage';
import { RequestEditor } from '@/components/editor/RequestEditor';
import { EnvSettings } from '@/components/env/EnvSettings';
import { useEditorStore } from '@/stores/editor-store';
import { useCollectionStore } from '@/stores/collection-store';
import { useDocsStore } from '@/stores/docs-store';

export function App() {
  const [envSettingsOpen, setEnvSettingsOpen] = useState(false);
  const [sidebarView, setSidebarView] = useState<'collection' | 'docs'>('collection');

  const sidebarWidth = useEditorStore((s) => s.sidebarWidth);
  const setSidebarWidth = useEditorStore((s) => s.setSidebarWidth);
  const activeFilePath = useCollectionStore((s) => s.activeFilePath);
  const activeDocPath = useDocsStore((s) => s.activeDocPath);

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
            <div className="h-full flex items-center justify-center text-text-muted text-sm">
              Doc renderer for {activeDocPath} — coming next
            </div>
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
