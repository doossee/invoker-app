import { TopBar } from '@/components/layout/TopBar';
import { Sidebar } from '@/components/layout/Sidebar';
import { StatusBar } from '@/components/layout/StatusBar';
import { ResizablePanel } from '@/components/layout/ResizablePanel';
import { useEditorStore } from '@/stores/editor-store';

export function App() {
  const sidebarWidth = useEditorStore((s) => s.sidebarWidth);
  const setSidebarWidth = useEditorStore((s) => s.setSidebarWidth);

  return (
    <div className="h-screen flex flex-col bg-bg text-text-primary overflow-hidden">
      <TopBar />

      <div className="flex-1 flex overflow-hidden">
        <ResizablePanel width={sidebarWidth} onWidthChange={setSidebarWidth}>
          <Sidebar>
            <div className="px-3 py-2 text-text-muted text-xs">File tree coming in Task 4</div>
          </Sidebar>
        </ResizablePanel>

        <div className="flex-1 flex items-center justify-center text-text-muted">
          Select a request from the sidebar
        </div>
      </div>

      <StatusBar />
    </div>
  );
}
