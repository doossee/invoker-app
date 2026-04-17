import { KeyValueTable } from '@/components/shared/KeyValueTable';

interface Props {
  headers: Record<string, string>;
  onChange: (headers: Record<string, string>) => void;
}

export function HeadersTab({ headers, onChange }: Props) {
  return (
    <div className="p-3">
      <KeyValueTable
        entries={headers}
        onChange={onChange}
        keyPlaceholder="Header name"
        valuePlaceholder="Header value"
      />
    </div>
  );
}
