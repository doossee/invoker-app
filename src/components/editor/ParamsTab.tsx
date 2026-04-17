import { KeyValueTable } from '@/components/shared/KeyValueTable';
import type { IvkDirectives } from 'ivkjs';

interface Props {
  directives: IvkDirectives;
  onChange: (directives: IvkDirectives) => void;
}

export function ParamsTab({ directives, onChange }: Props) {
  // Convert directives to a display format with @ prefix for keys
  const displayEntries: Record<string, string> = {};
  for (const [key, value] of Object.entries(directives)) {
    if (value !== undefined) {
      displayEntries[`@${key}`] = value;
    }
  }

  function handleChange(entries: Record<string, string>) {
    const next: IvkDirectives = {};
    for (const [key, value] of Object.entries(entries)) {
      // Strip the @ prefix when saving back
      const cleanKey = key.startsWith('@') ? key.slice(1) : key;
      if (cleanKey) {
        next[cleanKey] = value;
      }
    }
    onChange(next);
  }

  return (
    <div className="p-3">
      <KeyValueTable
        entries={displayEntries}
        onChange={handleChange}
        keyPlaceholder="@directive"
        valuePlaceholder="value"
      />
    </div>
  );
}
