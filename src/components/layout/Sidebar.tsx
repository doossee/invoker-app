import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export function Sidebar({ children }: Props) {
  return (
    <div className="h-full bg-surface overflow-y-auto flex flex-col">
      <div className="px-3 py-2 ghost-border-b">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-outline">
          Explorer
        </span>
      </div>
      {children}
    </div>
  );
}
