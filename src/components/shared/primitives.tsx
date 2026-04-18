import type { ReactNode, CSSProperties } from 'react';
import { ChevronDown } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Design tokens                                                      */
/* ------------------------------------------------------------------ */
export const TOKENS = {
  s0: '#000000',
  s1: '#0a0a0a',
  s2: '#131313',
  s3: '#191a1a',
  s4: '#1f2020',
  s5: '#252626',
  fg1: '#e7e5e4',
  fg2: '#acabaa',
  fg3: '#767575',
  fg4: '#484848',
  amber: '#e6c188',
  amberDim: '#dbc3a1',
  amberHot: '#ffcdb3',
  red: '#f97758',
  green: '#4ae176',
  blue: '#60a5fa',
  yellow: '#facc15',
  stroke: 'rgba(66,71,84,0.28)',
  strokeSoft: 'rgba(66,71,84,0.18)',
  strokeHot: 'rgba(230,193,136,0.35)',
};

export const METHOD_PALETTE: Record<string, { c: string; bg: string }> = {
  GET:    { c: '#4ae176', bg: 'rgba(74,225,118,0.14)' },
  POST:   { c: '#e6c188', bg: 'rgba(230,193,136,0.15)' },
  PUT:    { c: '#dbc3a1', bg: 'rgba(219,195,161,0.14)' },
  PATCH:  { c: '#ffcdb3', bg: 'rgba(255,205,179,0.14)' },
  DELETE: { c: '#f97758', bg: 'rgba(249,119,88,0.14)' },
};

/* ------------------------------------------------------------------ */
/*  InvokerMark (arc + dot logo)                                       */
/* ------------------------------------------------------------------ */
export function InvokerMark({ size = 16, color = TOKENS.amber }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" fill="none" style={{ flexShrink: 0, display: 'block' }}>
      <path d="M 56 36 A 20 20 0 1 0 36 56" stroke={color} strokeWidth="10" strokeLinecap="round" />
      <circle cx="56" cy="56" r="6" fill={color} />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  MethodBadge                                                        */
/* ------------------------------------------------------------------ */
export function MethodBadge({ method, compact }: { method: string; compact?: boolean }) {
  const s = METHOD_PALETTE[method] ?? { c: TOKENS.fg3, bg: 'rgba(118,117,117,0.14)' };
  const label = method === 'DELETE' ? 'DEL' : method;
  return (
    <span
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: compact ? 9 : 10,
        fontWeight: 700,
        letterSpacing: '0.08em',
        padding: compact ? '1px 4px' : '2px 6px',
        borderRadius: 3,
        color: s.c,
        background: s.bg,
        minWidth: compact ? 26 : 30,
        textAlign: 'center' as const,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Kbd                                                                 */
/* ------------------------------------------------------------------ */
export function Kbd({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
        fontWeight: 500,
        padding: '2px 5px',
        borderRadius: 4,
        color: TOKENS.fg2,
        background: TOKENS.s3,
        boxShadow: `inset 0 0 0 1px ${TOKENS.stroke}`,
        minWidth: 18,
        textAlign: 'center' as const,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        lineHeight: 1,
      }}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  PrimaryBtn                                                         */
/* ------------------------------------------------------------------ */
export function PrimaryBtn({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 14px',
        background: disabled ? 'rgba(230,193,136,0.5)' : TOKENS.amber,
        color: '#3a2807',
        border: 'none',
        borderRadius: 8,
        fontFamily: 'inherit',
        fontSize: 13,
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  GhostBtn                                                           */
/* ------------------------------------------------------------------ */
export function GhostBtn({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 12px',
        background: TOKENS.s3,
        color: TOKENS.fg1,
        border: 'none',
        borderRadius: 8,
        boxShadow: `inset 0 0 0 1px ${TOKENS.stroke}`,
        fontFamily: 'inherit',
        fontSize: 13,
        fontWeight: 500,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Tile (welcome bento grid)                                          */
/* ------------------------------------------------------------------ */
export function Tile({
  children,
  style,
  gradient,
}: {
  children: ReactNode;
  style?: CSSProperties;
  gradient?: boolean;
}) {
  return (
    <div
      style={{
        background: gradient
          ? `linear-gradient(135deg, rgba(230,193,136,0.06), rgba(230,193,136,0) 60%)`
          : TOKENS.s2,
        borderRadius: 14,
        padding: 18,
        boxShadow: `inset 0 0 0 1px ${TOKENS.stroke}`,
        display: 'flex',
        flexDirection: 'column' as const,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  TileHeader                                                         */
/* ------------------------------------------------------------------ */
export function TileHeader({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
        color: TOKENS.fg3,
        letterSpacing: '0.1em',
        textTransform: 'uppercase' as const,
      }}
    >
      <span style={{ color: TOKENS.amber, display: 'flex' }}>{icon}</span>
      <span>{label}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Chip                                                               */
/* ------------------------------------------------------------------ */
export function Chip({ children, icon }: { children: ReactNode; icon?: ReactNode }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '3px 9px',
        borderRadius: 9999,
        fontSize: 11,
        color: TOKENS.fg2,
        background: TOKENS.s3,
        boxShadow: `inset 0 0 0 1px ${TOKENS.strokeSoft}`,
      }}
    >
      {icon && <span style={{ color: TOKENS.fg3, display: 'flex' }}>{icon}</span>}
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  IconBtn                                                            */
/* ------------------------------------------------------------------ */
export function IconBtn({
  children,
  tip,
  onClick,
}: {
  children: ReactNode;
  tip?: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={tip}
      style={{
        width: 28,
        height: 28,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        border: 'none',
        borderRadius: 6,
        color: TOKENS.fg2,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Panel                                                              */
/* ------------------------------------------------------------------ */
export function Panel({
  children,
  style,
  className = '',
}: {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{
        background: TOKENS.s2,
        borderRadius: 12,
        boxShadow: `inset 0 0 0 1px ${TOKENS.stroke}`,
        overflow: 'hidden',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  TabBar                                                             */
/* ------------------------------------------------------------------ */
export function TabBar({
  tabs,
  active,
  onChange,
  right,
}: {
  tabs: readonly string[];
  active: string;
  onChange: (tab: string) => void;
  right?: ReactNode;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        boxShadow: `inset 0 -1px 0 ${TOKENS.strokeSoft}`,
        height: 34,
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', minWidth: 0, overflow: 'hidden' }}>
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => onChange(t)}
            style={{
              padding: '0 10px',
              height: 34,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 12,
              fontWeight: 500,
              color: active === t ? TOKENS.amber : TOKENS.fg2,
              position: 'relative' as const,
              whiteSpace: 'nowrap' as const,
              flexShrink: 0,
            }}
          >
            {t}
            {active === t && (
              <span
                style={{
                  position: 'absolute' as const,
                  left: 8,
                  right: 8,
                  bottom: -1,
                  height: 2,
                  background: TOKENS.amber,
                  borderRadius: 2,
                }}
              />
            )}
          </button>
        ))}
      </div>
      {right && (
        <>
          <div style={{ flex: 1, minWidth: 2 }} />
          <div style={{ flexShrink: 0 }}>{right}</div>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Toggle                                                             */
/* ------------------------------------------------------------------ */
export function Toggle({ on, onChange }: { on?: boolean; onChange?: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange?.(!on)}
      style={{
        width: 30,
        height: 17,
        borderRadius: 9999,
        background: on ? TOKENS.amber : TOKENS.s4,
        border: 'none',
        cursor: 'pointer',
        position: 'relative' as const,
        transition: 'background 0.15s',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: 'absolute' as const,
          width: 13,
          height: 13,
          borderRadius: 9999,
          background: on ? '#0a0a0a' : TOKENS.fg2,
          top: 2,
          left: on ? 15 : 2,
          transition: 'left 0.15s',
        }}
      />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Select                                                             */
/* ------------------------------------------------------------------ */
export function Select({ value, options }: { value: string; options?: string[] }) {
  return (
    <button
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '5px 8px 5px 10px',
        background: TOKENS.s3,
        border: 'none',
        borderRadius: 6,
        boxShadow: `inset 0 0 0 1px ${TOKENS.stroke}`,
        color: TOKENS.fg1,
        fontSize: 12,
        fontFamily: 'inherit',
        cursor: 'pointer',
      }}
    >
      {value}
      <ChevronDown size={10} style={{ color: TOKENS.fg3 }} />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  LearnCard                                                          */
/* ------------------------------------------------------------------ */
export function LearnCard({ n, title, body }: { n: string; title: string; body: ReactNode }) {
  return (
    <div
      style={{
        background: TOKENS.s2,
        borderRadius: 12,
        padding: 16,
        boxShadow: `inset 0 0 0 1px ${TOKENS.stroke}`,
      }}
    >
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: TOKENS.fg3, marginBottom: 8 }}>{n}</div>
      <div style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 600, fontSize: 15, color: TOKENS.fg1, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 12, color: TOKENS.fg2, lineHeight: 1.5 }}>{body}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SplitToggle                                                        */
/* ------------------------------------------------------------------ */
export function SplitToggle({
  value,
  onChange,
}: {
  value: 'horizontal' | 'vertical';
  onChange: (v: 'horizontal' | 'vertical') => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 0,
        background: TOKENS.s3,
        borderRadius: 6,
        boxShadow: `inset 0 0 0 1px ${TOKENS.strokeSoft}`,
        overflow: 'hidden',
      }}
    >
      <button
        onClick={() => onChange('horizontal')}
        title="Side by side"
        style={{
          width: 28,
          height: 28,
          border: 'none',
          background: value === 'horizontal' ? TOKENS.s5 : 'transparent',
          color: value === 'horizontal' ? TOKENS.amber : TOKENS.fg3,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="1" y="2" width="5" height="10" rx="1" stroke="currentColor" strokeWidth="1.2" />
          <rect x="8" y="2" width="5" height="10" rx="1" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      </button>
      <button
        onClick={() => onChange('vertical')}
        title="Stacked"
        style={{
          width: 28,
          height: 28,
          border: 'none',
          background: value === 'vertical' ? TOKENS.s5 : 'transparent',
          color: value === 'vertical' ? TOKENS.amber : TOKENS.fg3,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="2" y="1" width="10" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
          <rect x="2" y="8" width="10" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      </button>
    </div>
  );
}
