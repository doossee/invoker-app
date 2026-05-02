/**
 * Detect whether the app is running inside the Tauri runtime (desktop build).
 *
 * Tauri 2 injects multiple detection signals — we check all three to be safe:
 *   - `window.isTauri = true` — official public flag
 *   - `window.__TAURI_INTERNALS__` — JS↔Rust IPC bridge object
 *   - `window.__TAURI__` — legacy Tauri v1 marker (defensive)
 *
 * The earlier `'__TAURI__' in window` check missed Tauri 2 entirely, causing
 * the desktop build to silently fall through to the browser code path (the
 * "Open folder → no reaction" UX bug).
 */
export function isTauri(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as unknown as Record<string, unknown>;
  return Boolean(w.isTauri) || '__TAURI_INTERNALS__' in w || '__TAURI__' in w;
}

export function isPublished(): boolean {
  return typeof window !== 'undefined' && '__INVOKER_PUBLISHED__' in window;
}
