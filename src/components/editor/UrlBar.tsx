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
    <div className="flex items-center gap-2 p-3 border-b border-border">
      <select
        value={method}
        onChange={(e) => onMethodChange(e.target.value as HttpMethod)}
        className={`bg-surface-2 ${methodColors[method] ?? 'text-text-primary'} text-xs font-mono font-medium px-2 py-2 rounded border border-border focus:border-accent/50 focus:outline-none cursor-pointer appearance-none min-w-[80px] text-center`}
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
        className="flex-1 bg-surface-2 text-text-primary text-sm font-mono px-3 py-2 rounded border border-border focus:border-accent/50 focus:outline-none"
      />

      <button
        onClick={onSend}
        disabled={loading}
        className="flex items-center gap-1.5 bg-accent hover:bg-accent/80 disabled:bg-accent/50 text-white text-xs font-medium px-4 py-2 rounded transition-colors"
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
