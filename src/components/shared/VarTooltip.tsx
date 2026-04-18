import { useState, useEffect, useRef, useCallback } from 'react';
import { Copy, Check } from 'lucide-react';

interface Props {
  varName: string;
  value: string | undefined;
  position: { x: number; y: number };
  onSave: (value: string) => void;
  onClose: () => void;
}

export function VarTooltip({ varName, value, position, onSave, onClose }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? '');
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isSet = value !== undefined;

  // Adjust position to stay within viewport
  const adjustedPos = useRef(position);
  useEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      let x = position.x;
      let y = position.y;
      if (x + rect.width > window.innerWidth - 8) {
        x = window.innerWidth - rect.width - 8;
      }
      if (y + rect.height > window.innerHeight - 8) {
        y = position.y - rect.height - 8;
      }
      adjustedPos.current = { x: Math.max(4, x), y: Math.max(4, y) };
      ref.current.style.left = `${adjustedPos.current.x}px`;
      ref.current.style.top = `${adjustedPos.current.y}px`;
    }
  }, [position]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Focus input when editing
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editing]);

  const handleCopy = useCallback(() => {
    if (value) {
      navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }, [value]);

  const handleSave = useCallback(() => {
    onSave(draft);
    setEditing(false);
  }, [draft, onSave]);

  return (
    <div
      ref={ref}
      className="fixed z-50 bg-surface-container border border-outline-variant rounded-lg shadow-xl p-3 min-w-[220px] max-w-[320px]"
      style={{ left: position.x, top: position.y }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <code className="text-xs font-mono text-outline">{varName}</code>
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded-sm font-medium ${
            isSet ? 'bg-purple-500/15 text-purple-400' : 'bg-red-500/15 text-red-400'
          }`}
        >
          {isSet ? 'Environment' : 'Not Found'}
        </span>
      </div>

      {/* Value row */}
      {editing ? (
        <div className="flex items-center gap-1">
          <input
            ref={inputRef}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') { setEditing(false); onClose(); }
            }}
            className="flex-1 bg-surface-lowest text-on-surface text-xs font-mono px-2 py-1.5 rounded-md border border-primary/50 focus:outline-none"
          />
          <button
            onClick={handleSave}
            className="px-2 py-1.5 bg-primary text-on-primary text-xs rounded-md hover:bg-primary/80 transition-colors"
          >
            Save
          </button>
        </div>
      ) : (
        <div
          className="flex items-center gap-1 cursor-pointer group"
          onClick={() => { setEditing(true); setDraft(value ?? ''); }}
        >
          <div className="flex-1 bg-surface-lowest rounded-md px-2 py-1.5 text-xs font-mono min-h-[28px] flex items-center">
            {isSet ? (
              <span className="text-on-surface">{value}</span>
            ) : (
              <span className="text-outline italic">click to set</span>
            )}
          </div>
          {isSet && (
            <button
              onClick={(e) => { e.stopPropagation(); handleCopy(); }}
              className="p-1 text-outline hover:text-on-surface transition-colors"
            >
              {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
