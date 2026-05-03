import { useState } from 'react';
import { Send, Loader2, ChevronDown } from 'lucide-react';
import type { HttpMethod } from 'ivkjs';
import { useEnv } from '@/hooks/useEnv';
import { HighlightedText } from '@/components/shared/VariableTokens';

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
  const { get: resolveVar, setVariable } = useEnv();
  // Toggle the overlay off while the input is focused so typing feels normal
  // (plain text + caret). When blurred, the overlay reappears showing the
  // colored variables + hover popover — same visual as the inline block.
  const [focused, setFocused] = useState(false);

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

      {/* URL input + highlight overlay */}
      <div className="relative flex-1 min-w-0 flex items-stretch">
        {/* Overlay: rendered tokens visible when not focused. `pointer-events:
            none` on the container so clicks reach the input; individual
            token spans opt back in via `pointer-events: auto` so hover
            triggers the popover. */}
        {!focused && url && (
          <div
            aria-hidden="true"
            className="absolute inset-0 flex items-center font-mono pointer-events-none"
            style={{
              padding: '0 12px',
              fontSize: 13,
              color: 'var(--ivk-on-surface)',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
            }}
          >
            <HighlightedText text={url} resolver={resolveVar} onChangeVar={setVariable} />
          </div>
        )}

        <input
          type="text"
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !loading) onSend();
          }}
          // Don't advertise "paste cURL" until a parser ships — see
          // docs/BUGS.md → Missing features → "Real cURL → request import".
          placeholder="Enter request URL"
          className="flex-1 bg-transparent text-[13px] font-mono px-3 focus:outline-none min-w-0"
          style={{
            // Hide the input's own text glyphs while not focused so the
            // overlay isn't duplicated. Caret stays visible via caretColor.
            color: focused ? 'var(--ivk-on-surface)' : 'transparent',
            caretColor: 'var(--ivk-on-surface)',
          }}
        />
      </div>

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
