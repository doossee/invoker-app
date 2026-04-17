import { TopBar } from '@/components/layout/TopBar';
import { Sidebar } from '@/components/layout/Sidebar';
import { StatusBar } from '@/components/layout/StatusBar';
import { ResizablePanel } from '@/components/layout/ResizablePanel';
import { FileTree } from '@/components/collection/FileTree';
import { WelcomePage } from '@/components/welcome/WelcomePage';
import { RequestEditor } from '@/components/editor/RequestEditor';
import { useEditorStore } from '@/stores/editor-store';
import { useCollectionStore } from '@/stores/collection-store';

export function App() {
  const sidebarWidth = useEditorStore((s) => s.sidebarWidth);
  const setSidebarWidth = useEditorStore((s) => s.setSidebarWidth);
  const activeFilePath = useCollectionStore((s) => s.activeFilePath);

  return (
    <div className="h-screen flex flex-col bg-bg text-text-primary overflow-hidden">
      <TopBar />

      <div className="flex-1 flex overflow-hidden">
        <ResizablePanel width={sidebarWidth} onWidthChange={setSidebarWidth}>
          <Sidebar>
            <FileTree />
          </Sidebar>
        </ResizablePanel>

        <div className="flex-1 overflow-hidden">
          {activeFilePath ? (
            <RequestEditor filePath={activeFilePath} />
          ) : (
            <WelcomePage />
          )}
        </div>
      </div>

      <StatusBar />
    </div>
  );
}
