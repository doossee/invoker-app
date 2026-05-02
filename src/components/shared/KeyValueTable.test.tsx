import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { KeyValueTable } from './KeyValueTable';

describe('KeyValueTable', () => {
  it('renders existing entries as input rows', () => {
    render(
      <KeyValueTable
        entries={{ Authorization: 'Bearer abc', 'Content-Type': 'application/json' }}
        onChange={() => {}}
      />,
    );
    // Input fields show current keys/values.
    expect(screen.getByDisplayValue('Authorization')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Bearer abc')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Content-Type')).toBeInTheDocument();
    expect(screen.getByDisplayValue('application/json')).toBeInTheDocument();
  });

  it('Add button adds a new row with a unique generated key', async () => {
    const onChange = vi.fn();
    render(<KeyValueTable entries={{}} onChange={onChange} />);

    const addBtn = screen.getByRole('button', { name: /add/i });
    await userEvent.click(addBtn);

    // First click should produce a single new entry with a non-empty key.
    expect(onChange).toHaveBeenCalledOnce();
    const firstCall = onChange.mock.calls[0][0] as Record<string, string>;
    const keys = Object.keys(firstCall);
    expect(keys).toHaveLength(1);
    expect(keys[0]).not.toBe(''); // <-- the previous bug: started as ''
    expect(firstCall[keys[0]]).toBe('');
  });

  it('Add button generates a fresh key each click — never collides with existing keys', async () => {
    const onChange = vi.fn();
    // Start with one auto-style key already present.
    render(<KeyValueTable entries={{ key1: '' }} onChange={onChange} />);

    const addBtn = screen.getByRole('button', { name: /add/i });
    await userEvent.click(addBtn);

    expect(onChange).toHaveBeenCalledOnce();
    const next = onChange.mock.calls[0][0] as Record<string, string>;
    // Should now contain BOTH the existing key1 AND a new unique one.
    expect(Object.keys(next)).toHaveLength(2);
    expect(next.key1).toBe(''); // existing preserved
    const newKeys = Object.keys(next).filter((k) => k !== 'key1');
    expect(newKeys).toHaveLength(1);
    expect(newKeys[0]).not.toBe(''); // not the empty-string bug
    expect(newKeys[0]).not.toBe('key1'); // didn't collide
  });

  it('Add button works correctly across multiple clicks (regression)', async () => {
    // The original bug: addRow used `let newKey = ''` and `while (newKey in entries)`.
    // Since `'' in entries` is false initially, the loop never ran and newKey stayed ''.
    // First click: { '': '' } added. Second click: `{ ...entries, '': '' }` overwrites.
    // Result: clicking Add multiple times never added more than one row.
    const onChange = vi.fn();
    let entries: Record<string, string> = {};
    const { rerender } = render(<KeyValueTable entries={entries} onChange={onChange} />);

    const click = async () => {
      const btn = screen.getByRole('button', { name: /add/i });
      await userEvent.click(btn);
      // Promote the latest onChange payload into the controlled state.
      const calls = onChange.mock.calls;
      entries = calls[calls.length - 1][0] as Record<string, string>;
      rerender(<KeyValueTable entries={entries} onChange={onChange} />);
    };

    await click();
    await click();
    await click();

    expect(Object.keys(entries)).toHaveLength(3);
    // None of the generated keys is the empty string.
    expect(Object.keys(entries).every((k) => k !== '')).toBe(true);
  });
});
