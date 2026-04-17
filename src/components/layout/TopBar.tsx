import { Settings, Zap } from 'lucide-react';
import { useEnvStore } from '@/stores/env-store';

export function TopBar() {
  const activeEnvIndex = useEnvStore((s) => s.settings.activeEnvironmentIndex);
  const envs = useEnvStore((s) => s.settings.environments);
  const activeEnv = envs[activeEnvIndex];

  return (
    <div className="h-10 bg-surface border-b flex items-center px-4 gap-3 flex-shrink-0">
      <div className="flex items-center gap-1.5 text-accent font-semibold text-sm">
        <Zap size={16} />
        <span>Invoker</span>
      </div>

      <div className="flex-1" />

      {activeEnv && (
        <div className="flex items-center gap-1.5 text-xs">
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: activeEnv.color ?? '#22c55e' }}
          />
          <span className="text-text-dim">{activeEnv.name}</span>
        </div>
      )}

      <button className="p-1 rounded hover:bg-surface-2 text-text-muted hover:text-text-primary transition-colors">
        <Settings size={16} />
      </button>
    </div>
  );
}
