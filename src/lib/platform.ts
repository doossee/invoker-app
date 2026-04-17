export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}

export function isPublished(): boolean {
  return typeof window !== 'undefined' && '__INVOKER_PUBLISHED__' in window;
}
