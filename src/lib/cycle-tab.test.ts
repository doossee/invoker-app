import { describe, it, expect } from 'vitest';
import { nextTabPath } from './cycle-tab';

/**
 * Unit coverage for the Ctrl+Tab / Ctrl+Shift+Tab cycling helper.
 *
 * Settings → Keyboard advertised `⌃Tab "Next tab"` for a while but the
 * App.tsx keydown handler had no Tab branch — pressing Ctrl+Tab did
 * nothing. PR #61 wires it via this helper. The cycle logic is pure
 * (just modular arithmetic over an array), so vitest is enough; the
 * full keyboard-shortcut → store wiring is exercised manually + by
 * existing shortcut tests.
 */
describe('nextTabPath — Ctrl+Tab cycling', () => {
  const tabs = [
    { path: 'a.ivk' },
    { path: 'b.ivk' },
    { path: 'c.ivk' },
  ];

  it('forward: a → b → c', () => {
    expect(nextTabPath({ tabs, currentPath: 'a.ivk', shift: false })).toBe('b.ivk');
    expect(nextTabPath({ tabs, currentPath: 'b.ivk', shift: false })).toBe('c.ivk');
  });

  it('forward wraps from last to first (c → a)', () => {
    expect(nextTabPath({ tabs, currentPath: 'c.ivk', shift: false })).toBe('a.ivk');
  });

  it('backward: b → a, c → b', () => {
    expect(nextTabPath({ tabs, currentPath: 'b.ivk', shift: true })).toBe('a.ivk');
    expect(nextTabPath({ tabs, currentPath: 'c.ivk', shift: true })).toBe('b.ivk');
  });

  it('backward wraps from first to last (a → c)', () => {
    expect(nextTabPath({ tabs, currentPath: 'a.ivk', shift: true })).toBe('c.ivk');
  });

  it('returns null when tabs is empty', () => {
    expect(nextTabPath({ tabs: [], currentPath: 'a.ivk', shift: false })).toBeNull();
    expect(nextTabPath({ tabs: [], currentPath: null, shift: true })).toBeNull();
  });

  it('starts from index 0 when currentPath is null/undefined', () => {
    expect(nextTabPath({ tabs, currentPath: null, shift: false })).toBe('b.ivk');
    expect(nextTabPath({ tabs, currentPath: undefined, shift: false })).toBe('b.ivk');
  });

  it('starts from index 0 when currentPath does not match any tab', () => {
    expect(nextTabPath({ tabs, currentPath: 'unknown.ivk', shift: false })).toBe(
      'b.ivk',
    );
    // Backward from "no match → idx=0" wraps to last.
    expect(nextTabPath({ tabs, currentPath: 'unknown.ivk', shift: true })).toBe(
      'c.ivk',
    );
  });

  it('handles a single-tab list (cycles back to itself)', () => {
    const one = [{ path: 'only.ivk' }];
    expect(nextTabPath({ tabs: one, currentPath: 'only.ivk', shift: false })).toBe(
      'only.ivk',
    );
    expect(nextTabPath({ tabs: one, currentPath: 'only.ivk', shift: true })).toBe(
      'only.ivk',
    );
  });
});
