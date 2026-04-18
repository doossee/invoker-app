import { Send, Loader2, ChevronDown } from 'lucide-react';
import type { HttpMethod } from 'ivkjs';

const METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

const methodColors: Record<string, string> = {
  GET: 'var(--ivk-method-get)',
  POST: 'var(--ivk-method-post)',
  PUT: 'var(--ivk-method-put)',
  PATCH: 'var(--ivk-method-patch)',
  DELETE: 'var(--ivk-method-delete)',
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
  const color = methodColors[method] ?? 'var(--ivk-on-surface)';

  return (
    <div
      className="flex items-stretch h-[38px] bg-surface-container rounded-[10px] overflow-hidden"
      style={{ boxShadow: 'inset 0 0 0 1px rgba(66,71,84,0.28)' }}
    >
      {/* Method selector */}
      <div className="relative flex items-center shrink-0" style={{ borderRight: '1px solid rgba(66,71,84,0.18)' }}>
        <select
          value={method}
          onChange={(e) => onMethodChange(e.target.value as HttpMethod)}
          className="appearance-none bg-transparent font-mono text-xs font-semibold pl-3 pr-7 h-full cursor-pointer focus:outline-none"
          style={{ color, minWidth: 84 }}
        >
          {METHODS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <ChevronDown size={10} className="absolute right-2 text-outline pointer-events-none" />
      </div>

      {/* URL input */}
      <input
        type="text"
        value={url}
        onChange={(e) => onUrlChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !loading) onSend();
        }}
        placeholder="Enter URL or paste cURL..."
        className="flex-1 bg-transparent text-on-surface text-[13px] font-mono px-3 focus:outline-none min-w-0"
      />

      {/* Send button */}
      <button
        onClick={onSend}
        disabled={loading}
        className="flex items-center gap-1.5 px-[18px] bg-primary text-on-primary border-none cursor-pointer text-[13px] font-semibold disabled:opacity-50 shrink-0"
        style={{ fontFamily: 'inherit' }}
      >
        {loading ? (
          <Loader2 size={13} className="animate-spin" />
        ) : (
          <Send size={13} />
        )}
        <span>Send</span>
      </button>
    </div>
  );
}
