import { Plus, X } from 'lucide-react';

interface Props {
  entries: Record<string, string>;
  onChange: (entries: Record<string, string>) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
}

export function KeyValueTable({
  entries,
  onChange,
  keyPlaceholder = 'Key',
  valuePlaceholder = 'Value',
}: Props) {
  const pairs = Object.entries(entries);

  function updateKey(oldKey: string, newKey: string) {
    const next: Record<string, string> = {};
    for (const [k, v] of pairs) {
      if (k === oldKey) next[newKey] = v;
      else next[k] = v;
    }
    onChange(next);
  }

  function updateValue(key: string, newValue: string) {
    onChange({ ...entries, [key]: newValue });
  }

  function removeRow(key: string) {
    const next = { ...entries };
    delete next[key];
    onChange(next);
  }

  function addRow() {
    // Find a unique empty key
    let newKey = '';
    let i = 0;
    while (newKey in entries) {
      i++;
      newKey = `key${i}`;
    }
    onChange({ ...entries, [newKey]: '' });
  }

  return (
    <div className="space-y-1">
      {pairs.map(([key, value], idx) => (
        <div key={idx} className="flex items-center gap-1">
          <input
            type="text"
            value={key}
            onChange={(e) => updateKey(key, e.target.value)}
            placeholder={keyPlaceholder}
            className="flex-1 bg-surface-container text-on-surface text-xs font-mono px-2 py-1.5 rounded-md border border-transparent focus:border-primary/50 focus:outline-none"
          />
          <input
            type="text"
            value={value}
            onChange={(e) => updateValue(key, e.target.value)}
            placeholder={valuePlaceholder}
            className="flex-1 bg-surface-container text-on-surface text-xs font-mono px-2 py-1.5 rounded-md border border-transparent focus:border-primary/50 focus:outline-none"
          />
          <button
            onClick={() => removeRow(key)}
            className="p-1 text-outline hover:text-red-400 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      ))}

      <button
        onClick={addRow}
        className="flex items-center gap-1 text-xs text-on-surface-variant hover:text-primary transition-colors mt-2"
      >
        <Plus size={12} />
        Add
      </button>
    </div>
  );
}
