import type { ReactNode } from 'react';
import { Plus, Settings, Zap } from 'lucide-react';
import { EnvSwitcher } from '@/components/env/EnvSwitcher';

interface Props {
  children: ReactNode;
  onOpenSettings: () => void;
}

export function Sidebar({ children, onOpenSettings }: Props) {
  return (
    <div className="bg-surface-container-low rounded-xl border border-outline-variant/30 h-[calc(100vh-1.5rem)] overflow-hidden flex flex-col">
      {/* Project header */}
      <div className="px-3 pt-3 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            <Zap size={14} className="text-primary flex-shrink-0" />
            <span className="text-sm font-semibold text-primary truncate">
              My Collection
            </span>
          </div>
          <button
            className="flex-shrink-0 p-1 rounded text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
            title="Add item"
          >
            <Plus size={14} />
          </button>
        </div>
        <p className="text-[0.6875rem] leading-tight text-outline mt-0.5 ml-[22px]">
          API Documentation
        </p>
      </div>

      {/* Divider */}
      <div className="mx-3 ghost-border-b" style={{ height: 1 }} />

      {/* New Request button */}
      <div className="px-3 py-2">
        <button className="w-full flex items-center justify-center gap-1.5 ghost-border bg-surface-container text-on-surface rounded-md py-1.5 px-3 text-sm hover:bg-surface-high transition-colors">
          <Plus size={14} />
          <span>New Request</span>
        </button>
      </div>

      {/* File tree */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>

      {/* Footer: env switcher + settings */}
      <div className="mt-auto px-3 py-2 ghost-border-t flex items-center justify-between">
        <EnvSwitcher onManage={onOpenSettings} />
        <button
          onClick={onOpenSettings}
          className="p-1.5 rounded-md hover:bg-surface-container text-outline hover:text-on-surface transition-colors"
          title="Settings"
        >
          <Settings size={14} />
        </button>
      </div>
    </div>
  );
}
