import { Settings, Zap, FolderOpen } from 'lucide-react';
import { EnvSwitcher } from '@/components/env/EnvSwitcher';
import { useOpenCollection } from '@/hooks/useOpenCollection';
import { useEditorStore } from '@/stores/editor-store';
import { isPublished } from '@/lib/platform';

interface Props {
  onOpenSettings: () => void;
}

export function TopBar({ onOpenSettings }: Props) {
  const { openCollection, loading, isTauriApp } = useOpenCollection();
  const siteConfig = useEditorStore((s) => s.siteConfig);
  const published = isPublished();

  return (
    <div className="h-10 bg-surface border-b flex items-center px-4 gap-3 flex-shrink-0">
      <div className="flex items-center gap-1.5 text-accent font-semibold text-sm">
        {published && siteConfig ? (
          <>
            <span>{siteConfig.nav?.logo ?? '⚡'}</span>
            <span>{siteConfig.title}</span>
          </>
        ) : (
          <>
            <Zap size={16} />
            <span>Invoker</span>
          </>
        )}
      </div>

      {!published && isTauriApp && (
        <button
          onClick={openCollection}
          disabled={loading}
          title="Open Collection Folder"
          className="p-1 rounded hover:bg-surface-2 text-text-muted hover:text-text-primary transition-colors disabled:opacity-50"
        >
          <FolderOpen size={16} />
        </button>
      )}

      {published && siteConfig?.nav?.links && siteConfig.nav.links.length > 0 && (
        <div className="flex items-center gap-1">
          {siteConfig.nav.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-2 py-1 rounded text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>
      )}

      <div className="flex-1" />

      <EnvSwitcher onManage={onOpenSettings} />

      {!published && (
        <button
          onClick={onOpenSettings}
          className="p-1 rounded hover:bg-surface-2 text-text-muted hover:text-text-primary transition-colors"
        >
          <Settings size={16} />
        </button>
      )}
    </div>
  );
}
