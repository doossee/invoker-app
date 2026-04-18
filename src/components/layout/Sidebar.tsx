import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export function Sidebar({ children }: Props) {
  return (
    <div className="h-full bg-surface overflow-y-auto flex flex-col">
      <div className="px-3 py-1.5">
        <span className="text-[9px] font-medium uppercase tracking-widest text-outline/50">
          Explorer
        </span>
      </div>
      {children}
    </div>
  );
}
