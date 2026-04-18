import { Send, Loader2 } from 'lucide-react';
import type { HttpMethod } from 'ivkjs';

const METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

const methodColors: Record<string, string> = {
  GET: 'text-green-400',
  POST: 'text-blue-400',
  PUT: 'text-amber-400',
  PATCH: 'text-purple-400',
  DELETE: 'text-red-400',
};

interface Props {
  method: HttpMethod;
  url: string;
  onMethodChange: (method: HttpMethod) => void;
  onUrlChange: (url: string) => void;
  onSend: () => void;
  loading: boolean;
}

export function UrlBar({ method, url, onMethodChange, onUrlChange, onSend, loading }: Props) {
  return (
    <div className="flex items-center gap-2 p-3 ghost-border-b">
      <select
        value={method}
        onChange={(e) => onMethodChange(e.target.value as HttpMethod)}
        className={`bg-surface-container ${methodColors[method] ?? 'text-on-surface'} text-xs font-mono font-medium px-2 py-2 rounded-md border border-outline-variant focus:border-primary/50 focus:outline-none cursor-pointer appearance-none min-w-[80px] text-center`}
      >
        {METHODS.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>

      <input
        type="text"
        value={url}
        onChange={(e) => onUrlChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !loading) onSend();
        }}
        placeholder="Enter URL or paste cURL..."
        className="flex-1 bg-surface-container text-on-surface text-sm font-mono px-3 py-2 rounded-md border border-outline-variant focus:border-primary/50 focus:outline-none"
      />

      <button
        onClick={onSend}
        disabled={loading}
        className="flex items-center gap-1.5 bg-primary hover:bg-primary/80 disabled:bg-primary/50 text-on-primary text-xs font-medium px-4 py-2 rounded-md transition-colors"
      >
        {loading ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            ...
          </>
        ) : (
          <>
            <Send size={14} />
            Send
          </>
        )}
      </button>
    </div>
  );
}
