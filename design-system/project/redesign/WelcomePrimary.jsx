// Welcome / empty state — bento grid.
// Shown when no collection is open, or from File → New Window.
// Layout: hero + 4-tile bento + recent collections list.

const { TOKENS: T, I, InvokerMark, MethodBadge, Kbd } = window;

function WelcomePrimary() {
  return (
    <div style={{
      height: '100%', overflow: 'auto', background: T.s1, color: T.fg1,
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      <div style={{ maxWidth: 1040, margin: '0 auto', padding: '48px 40px 64px' }}>

        {/* ============ HERO ============ */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 44 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: 'rgba(230,193,136,0.08)',
            boxShadow: `inset 0 0 0 1px ${T.strokeHot}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <InvokerMark size={30}/>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 34,
              letterSpacing: '-0.02em', color: T.fg1, lineHeight: 1.1,
            }}>
              A git-native API workspace.
            </div>
            <div style={{ marginTop: 10, color: T.fg2, fontSize: 15, maxWidth: 520, lineHeight: 1.5 }}>
              Requests live as plain <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: T.amber }}>.ivk</code> files
              next to their code. Docs are <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: T.amber }}>README.md</code> in
              folders. Publish as a static site — no server, no account.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <GhostBtn><I.Book size={13}/>Docs</GhostBtn>
            <PrimaryBtn><I.Plus size={13}/>New collection</PrimaryBtn>
          </div>
        </div>

        {/* ============ BENTO ============ */}
        <div style={{
          display: 'grid', gap: 12,
          gridTemplateColumns: 'repeat(6, 1fr)',
          gridTemplateRows: 'repeat(2, minmax(140px, auto))',
          marginBottom: 40,
        }}>
          {/* TILE 1 — Open collection — tall */}
          <Tile style={{ gridColumn: 'span 3', gridRow: 'span 2', padding: 22,
            background: 'linear-gradient(135deg, rgba(230,193,136,0.06), rgba(230,193,136,0) 60%)' }}>
            <TileHeader icon={<I.FolderOpen size={14}/>} label="Open folder"/>
            <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 600, fontSize: 22,
              letterSpacing: '-0.01em', marginTop: 14, color: T.fg1, lineHeight: 1.2 }}>
              Point Invoker at a folder of .ivk and .md files.
            </div>
            <div style={{ marginTop: 8, color: T.fg2, fontSize: 13, lineHeight: 1.5 }}>
              Everything stays on your disk. No sign-in, no sync, no cloud.
            </div>
            <div style={{ marginTop: 22, display: 'flex', gap: 8 }}>
              <PrimaryBtn><I.FolderOpen size={13}/>Choose folder…</PrimaryBtn>
              <GhostBtn><I.Copy size={13}/>Clone from Git</GhostBtn>
            </div>
            <div style={{ flex: 1 }}/>
            <div style={{ display: 'flex', gap: 8, marginTop: 24, flexWrap: 'wrap' }}>
              <Chip icon={<I.File size={10}/>}>.ivk format</Chip>
              <Chip icon={<I.Book size={10}/>}>README.md</Chip>
              <Chip icon={<I.Link size={10}/>}>Git-native</Chip>
            </div>
          </Tile>

          {/* TILE 2 — New request */}
          <Tile style={{ gridColumn: 'span 3', gridRow: 'span 1', padding: 18 }}>
            <TileHeader icon={<I.Send size={13}/>} label="New request"/>
            <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 600, fontSize: 17,
              marginTop: 8, color: T.fg1 }}>
              Fire a request without a collection.
            </div>
            <div style={{ flex: 1 }}/>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 0, height: 30, borderRadius: 8,
                boxShadow: `inset 0 0 0 1px ${T.stroke}`, background: T.s3,
                fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: T.fg2,
                overflow: 'hidden', flex: 1, minWidth: 0,
              }}>
                <span style={{ padding: '0 10px', color: T.green, fontWeight: 700,
                  borderRight: `1px solid ${T.strokeSoft}` }}>GET</span>
                <span style={{ padding: '0 10px', opacity: 0.7 }}>https://…</span>
              </div>
              <PrimaryBtn><I.ArrowRight size={13}/></PrimaryBtn>
            </div>
          </Tile>

          {/* TILE 3 — Recent */}
          <Tile style={{ gridColumn: 'span 2', padding: 18 }}>
            <TileHeader icon={<I.Clock size={13}/>} label="Recent"/>
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { n: 'OVI Internal', s: '460 reqs' },
                { n: 'Stripe Playbook', s: '127 reqs' },
                { n: 'Acme Webhooks',  s: '14 reqs' },
              ].map(r => (
                <button key={r.n} style={recentRowStyle}>
                  <InvokerMark size={11} color={T.fg3}/>
                  <span style={{ flex: 1, textAlign: 'left', fontSize: 12 }}>{r.n}</span>
                  <span style={{ fontSize: 10, color: T.fg3 }}>{r.s}</span>
                </button>
              ))}
            </div>
          </Tile>

          {/* TILE 4 — Command palette teaser */}
          <Tile style={{ gridColumn: 'span 1', padding: 18, display: 'flex', flexDirection: 'column',
            alignItems: 'flex-start' }}>
            <TileHeader icon={<I.Terminal size={13}/>} label="Palette"/>
            <div style={{ flex: 1 }}/>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <Kbd>⌘</Kbd><Kbd>K</Kbd>
            </div>
            <div style={{ marginTop: 8, fontSize: 11, color: T.fg2 }}>Do anything.</div>
          </Tile>
        </div>

        {/* ============ SIGNAL LINE ============ */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20,
        }}>
          <div style={{ flex: 1, height: 1, background: T.strokeSoft }}/>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
            color: T.fg3, letterSpacing: '0.12em' }}>LEARN · 3 MIN</div>
          <div style={{ flex: 1, height: 1, background: T.strokeSoft }}/>
        </div>

        {/* ============ LEARN GRID ============ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <LearnCard n="01" title="The .ivk format"
            body="Plain text. Git-friendly. Variables with double braces — {{baseUrl}}."/>
          <LearnCard n="02" title="Folder = Docs"
            body="Add README.md to any folder. Invoker shows it as documentation."/>
          <LearnCard n="03" title="Publish to web"
            body={<><code style={codeInline}>npm run invoker:build</code> ships a static site.</>}/>
        </div>
      </div>
    </div>
  );
}

// =========================================================
const recentRowStyle = {
  display: 'flex', alignItems: 'center', gap: 8,
  padding: '6px 8px', borderRadius: 6, border: 'none',
  background: 'transparent', cursor: 'pointer', fontFamily: 'inherit',
  color: T.fg1,
};

const codeInline = {
  fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
  background: T.s3, padding: '1px 6px', borderRadius: 4, color: T.amber,
  boxShadow: `inset 0 0 0 1px ${T.strokeSoft}`,
};

function Tile({ children, style }) {
  return (
    <div style={{
      background: T.s2, borderRadius: 14, padding: 18,
      boxShadow: `inset 0 0 0 1px ${T.stroke}`,
      display: 'flex', flexDirection: 'column',
      ...style,
    }}>{children}</div>
  );
}

function TileHeader({ icon, label }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
      color: T.fg3, letterSpacing: '0.1em', textTransform: 'uppercase',
    }}>
      <span style={{ color: T.amber, display: 'flex' }}>{icon}</span>
      <span>{label}</span>
    </div>
  );
}

function PrimaryBtn({ children }) {
  return (
    <button style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '6px 14px', background: T.amber, color: '#3a2807',
      border: 'none', borderRadius: 8, cursor: 'pointer',
      fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
    }}>{children}</button>
  );
}
function GhostBtn({ children }) {
  return (
    <button style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '6px 12px', background: T.s3, color: T.fg1,
      border: 'none', borderRadius: 8, cursor: 'pointer',
      fontFamily: 'inherit', fontSize: 13, fontWeight: 500,
      boxShadow: `inset 0 0 0 1px ${T.stroke}`,
    }}>{children}</button>
  );
}

function Chip({ children, icon }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 9px', borderRadius: 9999, fontSize: 11,
      color: T.fg2, background: T.s3,
      boxShadow: `inset 0 0 0 1px ${T.strokeSoft}`,
    }}>
      <span style={{ color: T.fg3, display: 'flex' }}>{icon}</span>
      {children}
    </span>
  );
}

function LearnCard({ n, title, body }) {
  return (
    <div style={{
      background: T.s2, borderRadius: 12, padding: 16,
      boxShadow: `inset 0 0 0 1px ${T.stroke}`,
    }}>
      <div style={{ fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11, color: T.fg3, marginBottom: 8 }}>{n}</div>
      <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 600,
        fontSize: 15, color: T.fg1, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 12, color: T.fg2, lineHeight: 1.5 }}>{body}</div>
    </div>
  );
}

window.WelcomePrimary = WelcomePrimary;
