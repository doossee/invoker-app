import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export function Sidebar({ children }: Props) {
  return (
    <div className="h-full bg-surface overflow-y-auto flex flex-col">
      {children}
    </div>
  );
}
