import { FetchTransport } from 'ivkjs';

// Browser mode: standard fetch (subject to CORS).
// In future Spec 3, this will be swapped for TauriTransport when
// running inside the Tauri shell (CORS-free).
export const transport = new FetchTransport();
