import { fetch as tauriFetch } from '@tauri-apps/plugin-http';
import type { HttpTransport, NormalizedRequest, NormalizedResponse } from 'ivkjs';

export class TauriTransport implements HttpTransport {
  async send(request: NormalizedRequest): Promise<NormalizedResponse> {
    const start = Date.now();
    try {
      const init: RequestInit = {
        method: request.method,
        headers: request.headers,
      };
      if (request.body && ['POST', 'PUT', 'PATCH'].includes(request.method.toUpperCase())) {
        init.body = request.body;
      }
      const response = await tauriFetch(request.url, init);
      const body = await response.text();
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => { headers[key] = value; });
      return { status: response.status, headers, body, timeMs: Date.now() - start };
    } catch (e) {
      return { status: 0, headers: {}, body: '', timeMs: Date.now() - start, error: (e as Error).message };
    }
  }
}
