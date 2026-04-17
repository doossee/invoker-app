import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export function Sidebar({ children }: Props) {
  return (
    <div className="h-full bg-surface overflow-y-auto">
      <div className="px-3 py-2 text-[10px] font-semibold tracking-wider uppercase text-text-muted">
        Collection
      </div>
      {children}
    </div>
  );
}
