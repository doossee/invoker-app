import { FetchTransport, type HttpTransport } from 'ivkjs';
import { isTauri } from './platform';

let _transport: HttpTransport | null = null;

export async function getTransport(): Promise<HttpTransport> {
  if (_transport) return _transport;
  if (isTauri()) {
    const { TauriTransport } = await import('./tauri-transport');
    _transport = new TauriTransport();
  } else {
    _transport = new FetchTransport();
  }
  return _transport;
}

// Sync fallback for initial render
export const transport = new FetchTransport();
