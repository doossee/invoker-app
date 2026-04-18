import { Settings, Zap, FolderOpen } from 'lucide-react';
import { EnvSwitcher } from '@/components/env/EnvSwitcher';
import { useOpenCollection } from '@/hooks/useOpenCollection';
import { useEditorStore } from '@/stores/editor-store';
import { useCollectionStore } from '@/stores/collection-store';
import { useDocsStore } from '@/stores/docs-store';
import { isPublished } from '@/lib/platform';

interface Props {
  onOpenSettings: () => void;
}

/** Build breadcrumb segments from the active file path. */
function useBreadcrumb(): string[] | null {
  const ivkPath = useCollectionStore((s) => s.activeFilePath);
  const docPath = useDocsStore((s) => s.activeDocPath);
  const activePath = ivkPath || docPath;
  if (!activePath) return null;
  const parts = activePath.split('/');
  // Strip extension from the last segment
  const last = parts[parts.length - 1]!;
  parts[parts.length - 1] = last.replace(/\.(ivk|md)$/, '');
  return parts;
}

export function TopBar({ onOpenSettings }: Props) {
  const { openCollection, loading, isTauriApp } = useOpenCollection();
  const siteConfig = useEditorStore((s) => s.siteConfig);
  const published = isPublished();
  const breadcrumb = useBreadcrumb();

  return (
    <div className="h-11 bg-surface ghost-border-b flex items-center px-4 gap-3 flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-1.5 text-primary font-semibold text-sm">
        {published && siteConfig ? (
          <>
            <span>{siteConfig.nav?.logo ?? '\u26A1'}</span>
            <span>{siteConfig.title}</span>
          </>
        ) : (
          <>
            <Zap size={14} />
            <span>Invoker</span>
          </>
        )}
      </div>

      {/* Breadcrumb */}
      {breadcrumb && (
        <div className="flex items-center gap-0.5 text-xs text-outline min-w-0">
          <span className="text-outline/40 select-none">/</span>
          {breadcrumb.map((segment, i) => (
            <span key={i} className="flex items-center gap-0.5 min-w-0">
              {i > 0 && (
                <span className="text-outline/30 select-none mx-0.5">/</span>
              )}
              <span
                className={`truncate ${
                  i === breadcrumb.length - 1
                    ? 'text-on-surface-variant'
                    : 'text-outline/60'
                }`}
              >
                {segment}
              </span>
            </span>
          ))}
        </div>
      )}

      {!published && isTauriApp && (
        <button
          onClick={openCollection}
          disabled={loading}
          title="Open Collection Folder"
          className="p-1.5 rounded-md hover:bg-surface-container text-outline hover:text-on-surface transition-colors duration-150 disabled:opacity-50"
        >
          <FolderOpen size={15} />
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
              className="text-xs px-2 py-1 rounded-md text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
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
          className="p-2 rounded-md hover:bg-surface-container text-outline hover:text-on-surface transition-colors duration-150"
        >
          <Settings size={15} />
        </button>
      )}
    </div>
  );
}
