import { useEnvStore } from '@/stores/env-store';
import { useCollectionStore } from '@/stores/collection-store';

export function StatusBar() {
  const activeEnvIndex = useEnvStore((s) => s.settings.activeEnvironmentIndex);
  const envs = useEnvStore((s) => s.settings.environments);
  const activeEnv = envs[activeEnvIndex];
  const fileCount = useCollectionStore((s) => s.files.length);

  return (
    <div className="h-6 bg-surface border-t flex items-center px-3 gap-4 text-[11px] text-text-muted flex-shrink-0">
      {activeEnv && (
        <span className="flex items-center gap-1">
          <span className="text-amber-400">⚡</span>
          {activeEnv.name}
        </span>
      )}
      <span>{fileCount} requests</span>
    </div>
  );
}
