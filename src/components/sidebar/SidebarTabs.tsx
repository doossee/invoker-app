interface Props {
  view: 'collection' | 'docs';
  onChange: (view: 'collection' | 'docs') => void;
}

export function SidebarTabs({ view, onChange }: Props) {
  return (
    <div className="flex ghost-border-b">
      <button
        className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
          view === 'collection'
            ? 'text-primary border-b-2 border-primary'
            : 'text-outline hover:text-on-surface-variant'
        }`}
        onClick={() => onChange('collection')}
      >
        Collection
      </button>
      <button
        className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
          view === 'docs'
            ? 'text-primary border-b-2 border-primary'
            : 'text-outline hover:text-on-surface-variant'
        }`}
        onClick={() => onChange('docs')}
      >
        Docs
      </button>
    </div>
  );
}
