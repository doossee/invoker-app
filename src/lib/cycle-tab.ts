/**
 * Pure helper for the Ctrl+Tab / Ctrl+Shift+Tab editor-tab cycling
 * shortcut. Extracted so the wrap-around math is unit-testable
 * without driving a real browser keyboard event (Playwright's keyboard
 * API can collide with the browser's own tab cycler in some chromium
 * builds, making the e2e flaky).
 */

export interface CycleTabInput {
  /** Tabs in display order. */
  tabs: ReadonlyArray<{ path: string }>;
  /** Currently active tab path, or null/undefined if none active. */
  currentPath: string | null | undefined;
  /** false → next (forward), true → previous (backward). */
  shift: boolean;
}

/**
 * Returns the path of the next tab in the cycle (wrap-around).
 * - If `tabs` is empty → returns null (caller should bail).
 * - If `currentPath` doesn't match any tab → starts from index 0.
 * - With `shift=false`: idx + 1, wrapping past the last tab to the first.
 * - With `shift=true`: idx - 1, wrapping past the first to the last.
 */
export function nextTabPath(input: CycleTabInput): string | null {
  const { tabs, currentPath, shift } = input;
  if (tabs.length === 0) return null;
  const idx = tabs.findIndex((t) => t.path === currentPath);
  const start = idx === -1 ? 0 : idx;
  const delta = shift ? -1 : 1;
  // Positive modulo — JS's `%` returns negatives for negative operands.
  const next = ((start + delta) % tabs.length + tabs.length) % tabs.length;
  return tabs[next]!.path;
}
