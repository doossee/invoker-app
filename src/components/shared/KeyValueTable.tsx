import { useState, useEffect, useRef } from 'react';
import { Plus, X } from 'lucide-react';

interface Props {
  entries: Record<string, string>;
  onChange: (entries: Record<string, string>) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
}

interface Pair {
  id: string;
  key: string;
  value: string;
}

let _idCounter = 0;
const nextId = () => `kv-${++_idCounter}`;

function pairsFromEntries(entries: Record<string, string>): Pair[] {
  return Object.entries(entries).map(([key, value]) => ({ id: nextId(), key, value }));
}

function entriesFromPairs(pairs: Pair[]): Record<string, string> {
  // Empty-key pairs are valid mid-edit but can't survive in a Record (and
  // shouldn't be persisted as directives anyway). Drop them on serialize.
  // Last-write-wins for duplicate keys.
  const out: Record<string, string> = {};
  for (const p of pairs) {
    if (p.key) out[p.key] = p.value;
  }
  return out;
}

/**
 * Editable key/value rows. Maintains its own local state of `pairs` keyed by
 * stable IDs so that:
 *   - "Add" can append an empty row that survives parent re-renders even
 *     though it can't be represented in a `Record<string, string>` yet.
 *   - The cursor stays on the right input across re-renders even if the
 *     user is in the middle of editing the key (which would otherwise
 *     reorder Object.entries iteration).
 *   - External updates (e.g. parent component swaps the entries) still
 *     flow in and resync, but updates we trigger ourselves don't loop
 *     back and clobber in-progress edits.
 */
export function KeyValueTable({
  entries,
  onChange,
  keyPlaceholder = 'Key',
  valuePlaceholder = 'Value',
}: Props) {
  const [pairs, setPairs] = useState<Pair[]>(() => pairsFromEntries(entries));

  // Skip a sync pass after our own commit so the empty rows the user just
  // added (which aren't representable in `entries`) survive the round-trip.
  const selfUpdateRef = useRef(false);
  useEffect(() => {
    if (selfUpdateRef.current) {
      selfUpdateRef.current = false;
      return;
    }
    setPairs(pairsFromEntries(entries));
  }, [entries]);

  function commit(next: Pair[]) {
    selfUpdateRef.current = true;
    setPairs(next);
    onChange(entriesFromPairs(next));
  }

  function updateKey(id: string, newKey: string) {
    commit(pairs.map((p) => (p.id === id ? { ...p, key: newKey } : p)));
  }

  function updateValue(id: string, newValue: string) {
    commit(pairs.map((p) => (p.id === id ? { ...p, value: newValue } : p)));
  }

  function removeRow(id: string) {
    commit(pairs.filter((p) => p.id !== id));
  }

  function addRow() {
    // Local-only update — the new row has no key yet so it can't appear in
    // the persisted Record. Skip the onChange so we don't no-op the addition.
    // Once the user types a key into the row, updateKey → commit() will flush
    // it through onChange normally.
    selfUpdateRef.current = true;
    setPairs([...pairs, { id: nextId(), key: '', value: '' }]);
  }

  return (
    <div className="space-y-1">
      {pairs.map((p) => (
        <div key={p.id} className="flex items-center gap-1">
          <input
            type="text"
            value={p.key}
            onChange={(e) => updateKey(p.id, e.target.value)}
            placeholder={keyPlaceholder}
            className="flex-1 bg-surface-container text-on-surface text-xs font-mono px-2 py-1.5 rounded-md border border-transparent focus:border-primary/50 focus:outline-none"
          />
          <input
            type="text"
            value={p.value}
            onChange={(e) => updateValue(p.id, e.target.value)}
            placeholder={valuePlaceholder}
            className="flex-1 bg-surface-container text-on-surface text-xs font-mono px-2 py-1.5 rounded-md border border-transparent focus:border-primary/50 focus:outline-none"
          />
          <button
            onClick={() => removeRow(p.id)}
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
