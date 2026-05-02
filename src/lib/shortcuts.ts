/**
 * Layout-independent keyboard shortcut matcher.
 *
 * Always uses `e.code` (the *physical* key — `KeyK`, `Enter`, `Backslash`)
 * not `e.key` (the *character* — which on a Cyrillic layout returns `л`
 * for the physical K key, breaking shortcut detection).
 *
 * Treats Cmd (macOS) and Ctrl (Windows/Linux) as equivalent — same shortcut
 * works cross-platform without the consumer caring.
 *
 * Shift handling:
 *   - `opts.shift === undefined` → don't care (shortcut fires regardless)
 *   - `opts.shift === true` → shift MUST be held
 *   - `opts.shift === false` → shift MUST NOT be held (prevents Cmd+Shift+K
 *     from accidentally triggering a Cmd+K-only shortcut)
 *
 * @example
 *   if (matchShortcut(e, 'KeyK')) openCommandPalette();
 *   if (matchShortcut(e, 'KeyF', { shift: true })) formatJson();
 */
export function matchShortcut(
  e: KeyboardEvent,
  code: string,
  opts: { shift?: boolean } = {},
): boolean {
  const meta = e.metaKey || e.ctrlKey;
  if (!meta) return false;
  if (e.code !== code) return false;
  if (opts.shift !== undefined && e.shiftKey !== opts.shift) return false;
  return true;
}
