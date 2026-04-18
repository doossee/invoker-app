// Shared primitives for the Invoker redesign — tokens, icons, logo, chrome.

const TOKENS = {
  // Surfaces (Invoker Dark)
  s0: '#000000',
  s1: '#0a0a0a',   // app bg
  s2: '#131313',   // sidebar
  s3: '#191a1a',   // container
  s4: '#1f2020',   // container-high
  s5: '#252626',   // highest
  // Text
  fg1: '#e7e5e4',
  fg2: '#acabaa',
  fg3: '#767575',
  fg4: '#484848',
  // Accent
  amber: '#e6c188',
  amberDim: '#dbc3a1',
  amberHot: '#ffcdb3',
  red: '#f97758',
  green: '#4ae176',
  blue: '#60a5fa',
  yellow: '#facc15',
  // Ghost border token
  stroke: 'rgba(66,71,84,0.28)',
  strokeSoft: 'rgba(66,71,84,0.18)',
  strokeHot: 'rgba(230,193,136,0.35)',
};

// -------- ICONS (lucide-style, hand-drawn minimal set) --------
const Icon = ({ d, children, size = 14, stroke = 2, ...p }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
       fill="none" stroke="currentColor" strokeWidth={stroke}
       strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: 'block' }} {...p}>
    {d ? <path d={d}/> : children}
  </svg>
);
const I = {
  Plus:      (p) => <Icon {...p}><path d="M5 12h14"/><path d="M12 5v14"/></Icon>,
  Minus:     (p) => <Icon {...p}><path d="M5 12h14"/></Icon>,
  Send:      (p) => <Icon {...p}><path d="M22 2 11 13"/><path d="m22 2-7 20-4-9-9-4Z"/></Icon>,
  Play:      (p) => <Icon {...p}><polygon points="5 3 19 12 5 21 5 3"/></Icon>,
  Settings:  (p) => <Icon {...p}><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v10M4.22 4.22l4.24 4.24m7.08 7.08l4.24 4.24M1 12h6m6 0h10M4.22 19.78l4.24-4.24m7.08-7.08l4.24-4.24"/></Icon>,
  ChevDown:  (p) => <Icon {...p}><path d="m6 9 6 6 6-6"/></Icon>,
  ChevRight: (p) => <Icon {...p}><path d="m9 18 6-6-6-6"/></Icon>,
  ChevLeft:  (p) => <Icon {...p}><path d="m15 18-6-6 6-6"/></Icon>,
  ChevsUpDown: (p) => <Icon {...p}><path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/></Icon>,
  Folder:    (p) => <Icon {...p}><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2"/></Icon>,
  FolderOpen:(p) => <Icon {...p}><path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6A2 2 0 0 1 18.46 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2"/></Icon>,
  FolderPlus:(p) => <Icon {...p}><path d="M12 10v6"/><path d="M9 13h6"/><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2"/></Icon>,
  File:      (p) => <Icon {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></Icon>,
  FilePlus:  (p) => <Icon {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M12 18v-6"/><path d="M9 15h6"/></Icon>,
  Book:      (p) => <Icon {...p}><path d="M4 4h6a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4z"/><path d="M22 4h-6a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h6z"/></Icon>,
  Globe:     (p) => <Icon {...p}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></Icon>,
  Check:     (p) => <Icon {...p}><polyline points="20 6 9 17 4 12"/></Icon>,
  X:         (p) => <Icon {...p}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></Icon>,
  Search:    (p) => <Icon {...p}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></Icon>,
  Sliders:   (p) => <Icon {...p}><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></Icon>,
  Keyboard:  (p) => <Icon {...p}><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 8h.01"/><path d="M10 8h.01"/><path d="M14 8h.01"/><path d="M18 8h.01"/><path d="M6 12h.01"/><path d="M18 12h.01"/><path d="M7 16h10"/></Icon>,
  Database:  (p) => <Icon {...p}><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/></Icon>,
  Sparkle:   (p) => <Icon {...p}><path d="M12 3v18"/><path d="M3 12h18"/><path d="m5 5 14 14"/><path d="m19 5-14 14"/></Icon>,
  Palette:   (p) => <Icon {...p}><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 22a10 10 0 1 1 10-10c0 4-4 4-5 2-1-1-3-1-3 2 0 2-1 4-2 6"/></Icon>,
  User:      (p) => <Icon {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></Icon>,
  Clock:     (p) => <Icon {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></Icon>,
  ArrowRight:(p) => <Icon {...p}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></Icon>,
  Copy:      (p) => <Icon {...p}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></Icon>,
  Download:  (p) => <Icon {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></Icon>,
  Upload:    (p) => <Icon {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></Icon>,
  External:  (p) => <Icon {...p}><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></Icon>,
  Terminal:  (p) => <Icon {...p}><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></Icon>,
  Zap:       (p) => <Icon {...p}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></Icon>,
  Star:      (p) => <Icon {...p}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></Icon>,
  Circle:    (p) => <Icon {...p}><circle cx="12" cy="12" r="10"/></Icon>,
  Dot:       (p) => <Icon {...p}><circle cx="12" cy="12" r="3" fill="currentColor"/></Icon>,
  MoreH:     (p) => <Icon {...p}><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="19" cy="12" r="1" fill="currentColor"/><circle cx="5" cy="12" r="1" fill="currentColor"/></Icon>,
  Cmd:       (p) => <Icon {...p}><path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/></Icon>,
  Layers:    (p) => <Icon {...p}><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></Icon>,
  Link:      (p) => <Icon {...p}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></Icon>,
  ExternalLink: (p) => <Icon {...p}><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></Icon>,
  Edit:      (p) => <Icon {...p}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></Icon>,
  Cookie:    (p) => <Icon {...p}><path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"/><path d="M8.5 8.5v.01"/><path d="M16 15.5v.01"/><path d="M12 12v.01"/><path d="M11 17v.01"/><path d="M7 14v.01"/></Icon>,
  Table:     (p) => <Icon {...p}><path d="M3 3h18v18H3z"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/></Icon>,
  SplitH:    (p) => <Icon {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="3" x2="12" y2="21"/></Icon>,
  SplitV:    (p) => <Icon {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="12" x2="21" y2="12"/></Icon>,
};

// -------- INVOKER MARK (the Call) --------
function InvokerMark({ size = 16, color = TOKENS.amber }) {
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" fill="none" style={{ flexShrink: 0, display: 'block' }}>
      <path d="M 56 36 A 20 20 0 1 0 36 56" stroke={color} strokeWidth="10" strokeLinecap="round"/>
      <circle cx="56" cy="56" r="6" fill={color}/>
    </svg>
  );
}

// -------- METHOD BADGE --------
const METHOD_PALETTE = {
  GET:    { c: '#4ae176', bg: 'rgba(74,225,118,0.14)' },
  POST:   { c: '#e6c188', bg: 'rgba(230,193,136,0.15)' },
  PUT:    { c: '#dbc3a1', bg: 'rgba(219,195,161,0.14)' },
  PATCH:  { c: '#ffcdb3', bg: 'rgba(255,205,179,0.14)' },
  DELETE: { c: '#f97758', bg: 'rgba(249,119,88,0.14)' },
};
function MethodBadge({ method, compact = false }) {
  const s = METHOD_PALETTE[method] || { c: TOKENS.fg3, bg: 'rgba(118,117,117,0.14)' };
  const label = method === 'DELETE' ? 'DEL' : method;
  return (
    <span style={{
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: compact ? 9 : 10, fontWeight: 700,
      letterSpacing: '0.08em', padding: compact ? '1px 4px' : '2px 6px',
      borderRadius: 3, color: s.c, background: s.bg,
      minWidth: compact ? 26 : 30, textAlign: 'center', flexShrink: 0,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    }}>{label}</span>
  );
}

// -------- KBD --------
function Kbd({ children }) {
  return (
    <span style={{
      fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 500,
      padding: '2px 5px', borderRadius: 4, color: TOKENS.fg2,
      background: TOKENS.s3, boxShadow: `inset 0 0 0 1px ${TOKENS.stroke}`,
      minWidth: 18, textAlign: 'center', display: 'inline-flex',
      alignItems: 'center', justifyContent: 'center', lineHeight: 1,
    }}>{children}</span>
  );
}

// Shared button styles referenced across screens.
const primaryBtn = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  gap: 6, padding: '6px 12px', borderRadius: 8,
  background: TOKENS.amber, color: '#0a0a0a',
  border: 'none', fontFamily: 'inherit', fontSize: 12, fontWeight: 600,
  cursor: 'pointer',
};

const secondaryBtn = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  gap: 6, padding: '6px 12px', borderRadius: 8,
  background: TOKENS.s3, color: TOKENS.fg1,
  border: 'none', boxShadow: `inset 0 0 0 1px ${TOKENS.stroke}`,
  fontFamily: 'inherit', fontSize: 12, fontWeight: 500,
  cursor: 'pointer',
};

// Expose
Object.assign(window, { TOKENS, I, InvokerMark, MethodBadge, Kbd, primaryBtn, secondaryBtn });
