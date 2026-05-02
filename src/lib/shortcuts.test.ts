import { describe, it, expect } from 'vitest';
import { matchShortcut } from './shortcuts';

/**
 * Build a fake KeyboardEvent — `new KeyboardEvent('keydown', init)` works in
 * jsdom for our purposes. We pass `code` (physical key) and `key` (layout-
 * dependent character) explicitly to model the layout-independence intent.
 */
function makeKey(code: string, opts: {
  key?: string;
  meta?: boolean;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
} = {}): KeyboardEvent {
  return new KeyboardEvent('keydown', {
    code,
    key: opts.key ?? '',
    metaKey: opts.meta ?? false,
    ctrlKey: opts.ctrl ?? false,
    shiftKey: opts.shift ?? false,
    altKey: opts.alt ?? false,
  });
}

describe('matchShortcut', () => {
  it('matches Cmd+K (macOS) — meta + KeyK', () => {
    expect(matchShortcut(makeKey('KeyK', { meta: true, key: 'k' }), 'KeyK')).toBe(true);
  });

  it('matches Ctrl+K (Windows/Linux) — ctrl + KeyK', () => {
    expect(matchShortcut(makeKey('KeyK', { ctrl: true, key: 'k' }), 'KeyK')).toBe(true);
  });

  it('matches Cmd+K on Cyrillic layout — physical KeyK with key="л"', () => {
    // The actual user-facing bug: pressing the physical K key on a Russian
    // keyboard yields key='л', which broke the previous `e.key === 'k'` check.
    // e.code stays 'KeyK' regardless of layout.
    expect(matchShortcut(makeKey('KeyK', { meta: true, key: 'л' }), 'KeyK')).toBe(true);
  });

  it('matches Cmd+K on Arabic layout — physical KeyK with key="ل"', () => {
    expect(matchShortcut(makeKey('KeyK', { meta: true, key: 'ل' }), 'KeyK')).toBe(true);
  });

  it('does not match without meta or ctrl modifier', () => {
    expect(matchShortcut(makeKey('KeyK', { key: 'k' }), 'KeyK')).toBe(false);
  });

  it('does not match a different physical key', () => {
    expect(matchShortcut(makeKey('KeyJ', { meta: true, key: 'j' }), 'KeyK')).toBe(false);
  });

  it('respects shift requirement when set to true', () => {
    expect(matchShortcut(makeKey('KeyF', { meta: true, shift: true }), 'KeyF', { shift: true })).toBe(true);
    expect(matchShortcut(makeKey('KeyF', { meta: true, shift: false }), 'KeyF', { shift: true })).toBe(false);
  });

  it('respects shift requirement when set to false (rejects shift held)', () => {
    expect(matchShortcut(makeKey('KeyK', { meta: true, shift: true }), 'KeyK', { shift: false })).toBe(false);
  });

  it('ignores shift state when no shift requirement is given', () => {
    // Shift is allowed but not required — matches in both states. Useful for
    // shortcuts that don't care (rare; most should be explicit).
    expect(matchShortcut(makeKey('KeyK', { meta: true, shift: true }), 'KeyK')).toBe(true);
    expect(matchShortcut(makeKey('KeyK', { meta: true, shift: false }), 'KeyK')).toBe(true);
  });

  it('matches Enter (layout-independent)', () => {
    expect(matchShortcut(makeKey('Enter', { meta: true, key: 'Enter' }), 'Enter')).toBe(true);
  });

  it('matches Backslash (layout-independent code)', () => {
    expect(matchShortcut(makeKey('Backslash', { meta: true, key: '\\' }), 'Backslash')).toBe(true);
  });
});
