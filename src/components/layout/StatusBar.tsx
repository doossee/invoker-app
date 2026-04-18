import { useEnvStore } from '@/stores/env-store';
import { useCollectionStore } from '@/stores/collection-store';

export function StatusBar() {
  const activeEnvIndex = useEnvStore((s) => s.settings.activeEnvironmentIndex);
  const envs = useEnvStore((s) => s.settings.environments);
  const activeEnv = envs[activeEnvIndex];
  const fileCount = useCollectionStore((s) => s.files.length);
  const collectionPath = useCollectionStore((s) => s.collectionPath);

  const folderLabel = collectionPath
    ? collectionPath.split('/').filter(Boolean).pop() ?? collectionPath
    : '(sample)';

  return (
    <div className="h-6 bg-surface ghost-border-t flex items-center px-3 gap-4 text-[11px] text-outline flex-shrink-0">
      {activeEnv && (
        <span className="flex items-center gap-1">
          <span className="text-tertiary">⚡</span>
          {activeEnv.name}
        </span>
      )}
      <span>{fileCount} requests</span>
      <span className="ml-auto truncate max-w-xs">{folderLabel}</span>
    </div>
  );
}
