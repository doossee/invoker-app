import { Zap, Send, Globe, Code2, FolderOpen } from 'lucide-react';
import { isTauri } from '@/lib/platform';
import { useOpenCollection } from '@/hooks/useOpenCollection';

export function WelcomePage() {
  const { openCollection, loading } = useOpenCollection();
  const tauriApp = isTauri();

  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
            <Zap size={32} className="text-primary" />
          </div>
        </div>
        <h2 className="text-xl font-semibold text-on-surface mb-2">Welcome to Invoker</h2>
        <p className="text-sm text-on-surface-variant mb-2">Select a request from the sidebar to get started.</p>
        {!tauriApp && (
          <p className="text-xs text-outline mb-6">(sample data)</p>
        )}
        {tauriApp && <div className="mb-6" />}

        <div className="grid gap-3 text-left text-xs">
          {tauriApp && (
            <button
              onClick={openCollection}
              disabled={loading}
              className="flex items-center gap-3 p-3 rounded-lg bg-surface ghost-border hover:bg-surface-container transition-colors text-left disabled:opacity-50 w-full"
            >
              <FolderOpen size={16} className="text-primary flex-shrink-0" />
              <div>
                <div className="font-medium text-on-surface">Open Collection</div>
                <div className="text-outline">Load .ivk files from a folder</div>
              </div>
            </button>
          )}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-surface ghost-border">
            <Send size={16} className="text-primary flex-shrink-0" />
            <div>
              <div className="font-medium text-on-surface">Send Request</div>
              <div className="text-outline">Cmd + Enter</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-surface ghost-border">
            <Globe size={16} className="text-tertiary flex-shrink-0" />
            <div>
              <div className="font-medium text-on-surface">Switch Environment</div>
              <div className="text-outline">Cmd + E</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-surface ghost-border">
            <Code2 size={16} className="text-secondary flex-shrink-0" />
            <div>
              <div className="font-medium text-on-surface">Format JSON</div>
              <div className="text-outline">Cmd + Shift + F</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
