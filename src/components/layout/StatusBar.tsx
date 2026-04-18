import { useEnvStore } from '@/stores/env-store';
import { useCollectionStore } from '@/stores/collection-store';
import { useDocsStore } from '@/stores/docs-store';

export function StatusBar() {
  const activeEnvIndex = useEnvStore((s) => s.settings.activeEnvironmentIndex);
  const envs = useEnvStore((s) => s.settings.environments);
  const activeEnv = envs[activeEnvIndex];
  const fileCount = useCollectionStore((s) => s.files.length);
  const docCount = useDocsStore((s) => s.docs.length);
  const collectionPath = useCollectionStore((s) => s.collectionPath);

  const folderLabel = collectionPath
    ? collectionPath.split('/').filter(Boolean).pop() ?? collectionPath
    : '(sample)';

  return (
    <div className="h-7 bg-surface ghost-border-t flex items-center px-3 gap-4 text-xs text-outline flex-shrink-0">
      {/* Left side: env indicator + file count */}
      <div className="flex items-center gap-3">
        {activeEnv && (
          <span className="flex items-center gap-1">
            <span className="text-tertiary">{'\u26A1'}</span>
            <span>{activeEnv.name}</span>
          </span>
        )}
        <span>
          {fileCount} request{fileCount !== 1 ? 's' : ''}
          {docCount > 0 && (
            <span className="text-outline/50">{' \u00B7 '}{docCount} doc{docCount !== 1 ? 's' : ''}</span>
          )}
        </span>
      </div>

      <div className="flex-1" />

      {/* Right side: collection path */}
      <span className="truncate max-w-xs">{folderLabel}</span>
    </div>
  );
}
