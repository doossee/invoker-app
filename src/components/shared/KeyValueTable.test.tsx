import { describe, it, expect, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { KeyValueTable } from './KeyValueTable';

/**
 * KeyValueTable owns its own `Pair[]` state internally so that:
 *   - Empty rows can exist mid-edit even though they can't appear in the
 *     parent's `Record<string, string>`.
 *   - Cursor/focus survive when the user types a key (which would otherwise
 *     reorder Object.entries and remount inputs).
 *
 * Tests exercise the externally-visible behavior: render existing entries,
 * Add/Remove rows in the DOM, rename → onChange flushes, type a value →
 * onChange flushes. Empty-key rows live in local state only and never reach
 * the parent's onChange (verified explicitly).
 */
describe('KeyValueTable', () => {
  it('renders existing entries as input rows', () => {
    render(
      <KeyValueTable
        entries={{ Authorization: 'Bearer abc', 'Content-Type': 'application/json' }}
        onChange={() => {}}
      />,
    );
    expect(screen.getByDisplayValue('Authorization')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Bearer abc')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Content-Type')).toBeInTheDocument();
    expect(screen.getByDisplayValue('application/json')).toBeInTheDocument();
  });

  it('Add button appends a new editable row to the DOM (does not call onChange yet)', async () => {
    const onChange = vi.fn();
    render(<KeyValueTable entries={{}} onChange={onChange} />);

    // Initially no key/value inputs (only the Add button).
    expect(screen.queryAllByPlaceholderText('Key')).toHaveLength(0);

    await userEvent.click(screen.getByRole('button', { name: /add/i }));

    // A new empty key input appears.
    expect(screen.queryAllByPlaceholderText('Key')).toHaveLength(1);
    // Empty rows aren't representable in Record<string, string>, so onChange
    // is intentionally NOT called yet — wait for the user to type a key.
    expect(onChange).not.toHaveBeenCalled();
  });

  it('multiple Add clicks each append their own row (regression)', async () => {
    // Original bug: addRow used `newKey = ''` + `while (newKey in entries)`,
    // so every click overwrote `entries[''] = ''` and only one row could
    // ever appear. Now addRow appends to local Pair[] state with stable IDs,
    // so each click is independent.
    render(<KeyValueTable entries={{}} onChange={() => {}} />);

    const addBtn = screen.getByRole('button', { name: /add/i });
    await userEvent.click(addBtn);
    await userEvent.click(addBtn);
    await userEvent.click(addBtn);

    expect(screen.queryAllByPlaceholderText('Key')).toHaveLength(3);
    expect(screen.queryAllByPlaceholderText('Value')).toHaveLength(3);
  });

  it('rapid synchronous Add clicks all land — does not drop batched updates (regression)', () => {
    // Regression for the stale-closure bug: addRow used `setPairs([...pairs, …])`
    // — `pairs` is captured from the closure of the current render. When
    // multiple click events are dispatched inside a single React batch (rapid
    // mash, automation that fires clicks back-to-back without yielding,
    // dispatched MouseEvents from a script), every handler sees the same
    // stale `pairs` snapshot and only the last write survives.
    //
    // The fix is functional setState: `setPairs(prev => [...prev, …])` so each
    // queued update sees the result of the previous queued one, not the render
    // snapshot.
    //
    // Implementation note: native `el.click()` calls inside a single `act()`
    // simulate the real-world batched scenario — React 18 auto-batches the
    // three handler invocations, captures the closed-over `pairs=[]` three
    // times, and (with the bug) commits only the last write.
    render(<KeyValueTable entries={{}} onChange={() => {}} />);

    const addBtn = screen.getByRole('button', { name: /add/i });
    act(() => {
      addBtn.click();
      addBtn.click();
      addBtn.click();
    });

    expect(screen.queryAllByPlaceholderText('Key')).toHaveLength(3);
    expect(screen.queryAllByPlaceholderText('Value')).toHaveLength(3);
  });

  it('typing a key into a fresh row flushes through onChange with the typed key', async () => {
    const onChange = vi.fn();
    render(<KeyValueTable entries={{}} onChange={onChange} />);

    await userEvent.click(screen.getByRole('button', { name: /add/i }));
    const keyInput = screen.getByPlaceholderText('Key');
    await userEvent.type(keyInput, 'X-Trace');

    // onChange fires per keystroke; after the full word, last call should
    // have the complete key with empty value (the row's value field is still empty).
    const last = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(last).toEqual({ 'X-Trace': '' });
  });

  it('typing into the value field flushes through onChange', async () => {
    const onChange = vi.fn();
    render(<KeyValueTable entries={{ 'X-Custom': '' }} onChange={onChange} />);

    const valueInput = screen.getByPlaceholderText('Value');
    await userEvent.type(valueInput, 'foo');

    const last = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(last).toEqual({ 'X-Custom': 'foo' });
  });

  it('Remove (X) button drops the row and flushes the new entries', async () => {
    const onChange = vi.fn();
    render(
      <KeyValueTable
        entries={{ a: '1', b: '2' }}
        onChange={onChange}
      />,
    );

    // Find the X button next to the row whose key is 'a'.
    const allButtons = screen.getAllByRole('button');
    // First two role=button are the X-buttons (one per row), then the Add button.
    // We click the first X to remove row 'a'.
    await userEvent.click(allButtons[0]);

    const last = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(last).toEqual({ b: '2' });
  });
});
