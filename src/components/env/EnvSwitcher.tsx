import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check, Settings2 } from 'lucide-react';
import { useEnvStore } from '@/stores/env-store';

interface Props {
  onManage: () => void;
}

export function EnvSwitcher({ onManage }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const activeEnvIndex = useEnvStore((s) => s.settings.activeEnvironmentIndex);
  const envs = useEnvStore((s) => s.settings.environments);
  const setActiveEnv = useEnvStore((s) => s.setActiveEnv);
  const activeEnv = envs[activeEnvIndex];

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  function handleSelect(index: number) {
    setActiveEnv(index);
    setOpen(false);
  }

  function handleManage() {
    setOpen(false);
    onManage();
  }

  if (!activeEnv) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-surface-container transition-colors text-xs"
      >
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: activeEnv.color ?? '#22c55e' }}
        />
        <span className="text-on-surface-variant">{activeEnv.name}</span>
        <ChevronDown
          size={12}
          className={`text-outline transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-surface border border-outline-variant rounded-lg shadow-lg z-50 py-1">
          {envs.map((env, i) => (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-surface-container transition-colors text-left"
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: env.color ?? '#22c55e' }}
              />
              <span className="flex-1 text-on-surface">{env.name}</span>
              {i === activeEnvIndex && (
                <Check size={12} className="text-primary flex-shrink-0" />
              )}
            </button>
          ))}

          <div className="border-t border-outline-variant mt-1 pt-1">
            <button
              onClick={handleManage}
              className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-surface-container transition-colors text-on-surface-variant hover:text-on-surface"
            >
              <Settings2 size={12} />
              Manage environments
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
