import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export function Sidebar({ children }: Props) {
  return (
    <div className="h-full bg-surface overflow-y-auto flex flex-col">
      <div className="px-3 py-2 border-b border-border">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
          Explorer
        </span>
      </div>
      {children}
    </div>
  );
}
