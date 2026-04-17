import { Settings, Zap, FolderOpen } from 'lucide-react';
import { EnvSwitcher } from '@/components/env/EnvSwitcher';
import { useOpenCollection } from '@/hooks/useOpenCollection';

interface Props {
  onOpenSettings: () => void;
}

export function TopBar({ onOpenSettings }: Props) {
  const { openCollection, loading, isTauriApp } = useOpenCollection();

  return (
    <div className="h-10 bg-surface border-b flex items-center px-4 gap-3 flex-shrink-0">
      <div className="flex items-center gap-1.5 text-accent font-semibold text-sm">
        <Zap size={16} />
        <span>Invoker</span>
      </div>

      {isTauriApp && (
        <button
          onClick={openCollection}
          disabled={loading}
          title="Open Collection Folder"
          className="p-1 rounded hover:bg-surface-2 text-text-muted hover:text-text-primary transition-colors disabled:opacity-50"
        >
          <FolderOpen size={16} />
        </button>
      )}

      <div className="flex-1" />

      <EnvSwitcher onManage={onOpenSettings} />

      <button
        onClick={onOpenSettings}
        className="p-1 rounded hover:bg-surface-2 text-text-muted hover:text-text-primary transition-colors"
      >
        <Settings size={16} />
      </button>
    </div>
  );
}
