interface Props {
  view: 'collection' | 'docs';
  onChange: (view: 'collection' | 'docs') => void;
}

export function SidebarTabs({ view, onChange }: Props) {
  return (
    <div className="flex border-b border-border">
      <button
        className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
          view === 'collection'
            ? 'text-accent border-b-2 border-accent'
            : 'text-text-muted hover:text-text-dim'
        }`}
        onClick={() => onChange('collection')}
      >
        Collection
      </button>
      <button
        className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
          view === 'docs'
            ? 'text-accent border-b-2 border-accent'
            : 'text-text-muted hover:text-text-dim'
        }`}
        onClick={() => onChange('docs')}
      >
        Docs
      </button>
    </div>
  );
}
