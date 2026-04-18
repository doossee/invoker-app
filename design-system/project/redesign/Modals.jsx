// Modal-style screens: Settings, Env settings, Command Palette, First Run.
// Each renders as a full-viewport scrim with the modal centered on top,
// so the viewer understands these are overlays over the main shell.

// =========================================================================
// Shared modal chrome
// =========================================================================

function ModalFrame({ children, width = 860, height = 560, padded = true }) {
  return (
    <div style={{
      position: 'relative', width: '100%', height: '100%',
      background: 'radial-gradient(circle at 50% 40%, #0a0a0a 0%, #000 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden',
    }}>
      {/* soft mock-shell behind */}
      <div style={{
        position: 'absolute', inset: 24, borderRadius: 14,
        background: T.s1, opacity: 0.45,
        boxShadow: `inset 0 0 0 1px ${T.strokeSoft}`,
      }}/>
      <div style={{
        position: 'absolute', top: 40, left: 40, display: 'flex', gap: 6, opacity: 0.35,
      }}>
        <span style={{ width: 10, height: 10, borderRadius: 9999, background: '#333' }}/>
        <span style={{ width: 10, height: 10, borderRadius: 9999, background: '#333' }}/>
        <span style={{ width: 10, height: 10, borderRadius: 9999, background: '#333' }}/>
      </div>
      <div style={{
        position: 'relative', width, height, maxWidth: '94%', maxHeight: '90%',
        background: T.s2, borderRadius: 12,
        boxShadow: `0 30px 80px rgba(0,0,0,0.6), inset 0 0 0 1px ${T.stroke}`,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        padding: padded ? 0 : 0,
      }}>
        {children}
      </div>
    </div>
  );
}

// =========================================================================
// Settings modal — left rail with pages, content on the right.
// =========================================================================

function SettingsModal() {
  const pages = [
    { id: 'general',   label: 'General',     icon: <I.Sliders size={13}/> },
    { id: 'appearance',label: 'Appearance',  icon: <I.Palette size={13}/> },
    { id: 'keyboard',  label: 'Keyboard',    icon: <I.Keyboard size={13}/> },
    { id: 'ai',        label: 'AI',          icon: <I.Sparkle size={13}/> },
    { id: 'data',      label: 'Data & sync', icon: <I.Database size={13}/> },
    { id: 'account',   label: 'Account',     icon: <I.User size={13}/> },
  ];
  const [active, setActive] = React.useState('appearance');

  return (
    <ModalFrame width={820} height={540}>
      {/* Header */}
      <div style={{
        height: 44, display: 'flex', alignItems: 'center', padding: '0 14px',
        borderBottom: `1px solid ${T.strokeSoft}`,
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.fg1 }}>Settings</div>
        <div style={{ flex: 1 }}/>
        <Kbd>Esc</Kbd>
        <button style={{
          width: 22, height: 22, background: 'transparent', border: 'none',
          color: T.fg3, cursor: 'pointer', marginLeft: 6,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}><I.X size={13}/></button>
      </div>

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Page rail */}
        <div style={{
          width: 176, borderRight: `1px solid ${T.strokeSoft}`,
          padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 1,
        }}>
          {pages.map(p => (
            <button key={p.id} onClick={() => setActive(p.id)} style={{
              display: 'flex', alignItems: 'center', gap: 9,
              padding: '6px 9px', borderRadius: 6, border: 'none',
              background: active === p.id ? T.s4 : 'transparent',
              color: active === p.id ? T.fg1 : T.fg2,
              fontFamily: 'inherit', fontSize: 12, cursor: 'pointer', textAlign: 'left',
            }}>
              <span style={{ color: active === p.id ? T.amber : T.fg3, display: 'flex' }}>{p.icon}</span>
              {p.label}
            </button>
          ))}
        </div>

        {/* Page body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px' }}>
          {active === 'appearance' && <AppearancePage/>}
          {active === 'general' && <GeneralPage/>}
          {active === 'keyboard' && <KeyboardPage/>}
          {active === 'ai' && <AIPage/>}
          {active === 'data' && <DataPage/>}
          {active === 'account' && <AccountPage/>}
        </div>
      </div>
    </ModalFrame>
  );
}

function PageTitle({ children, note }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700,
        fontSize: 18, color: T.fg1, letterSpacing: '-0.01em' }}>{children}</div>
      {note && <div style={{ marginTop: 4, fontSize: 12, color: T.fg3 }}>{note}</div>}
    </div>
  );
}

function Row({ label, hint, children }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '12px 0', borderBottom: `1px solid ${T.strokeSoft}`,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: T.fg1, fontWeight: 500 }}>{label}</div>
        {hint && <div style={{ fontSize: 11, color: T.fg3, marginTop: 2 }}>{hint}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}

function Toggle({ on = false }) {
  const [v, setV] = React.useState(on);
  return (
    <button onClick={() => setV(!v)} style={{
      width: 30, height: 17, borderRadius: 9999, border: 'none',
      background: v ? T.amber : T.s4, position: 'relative',
      cursor: 'pointer', transition: 'background 0.15s',
    }}>
      <span style={{
        position: 'absolute', top: 2, left: v ? 15 : 2,
        width: 13, height: 13, borderRadius: 9999,
        background: v ? '#0a0a0a' : T.fg2, transition: 'left 0.15s',
      }}/>
    </button>
  );
}

function Select({ value, options }) {
  return (
    <button style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '5px 8px 5px 10px', background: T.s3,
      border: 'none', borderRadius: 6,
      boxShadow: `inset 0 0 0 1px ${T.stroke}`,
      color: T.fg1, fontSize: 12, fontFamily: 'inherit', cursor: 'pointer',
    }}>
      {value}
      <I.ChevDown size={10} style={{ color: T.fg3 }}/>
    </button>
  );
}

function AppearancePage() {
  const [theme, setTheme] = React.useState('dark');
  return (
    <div>
      <PageTitle note="Fine-tune how Invoker looks.">Appearance</PageTitle>

      {/* Theme swatches */}
      <div style={{ fontSize: 11, color: T.fg3, marginBottom: 10,
        fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.1em', textTransform: 'uppercase' }}>Theme</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 24 }}>
        {[
          { id: 'dark',  label: 'Invoker Dark',  bg: '#0a0a0a', fg: '#e7e5e4', accent: T.amber },
          { id: 'light', label: 'Paper',         bg: '#f6f4ef', fg: '#23201c', accent: '#b87333' },
          { id: 'dim',   label: 'Dim',           bg: '#1c1c1c', fg: '#cfcbc5', accent: '#d9b382' },
        ].map(t => (
          <button key={t.id} onClick={() => setTheme(t.id)} style={{
            position: 'relative', padding: 0, background: 'transparent',
            border: 'none', cursor: 'pointer', textAlign: 'left',
          }}>
            <div style={{
              height: 72, borderRadius: 8, background: t.bg, overflow: 'hidden',
              boxShadow: theme === t.id
                ? `inset 0 0 0 1px ${T.amber}, 0 0 0 2px rgba(230,193,136,0.2)`
                : `inset 0 0 0 1px ${T.strokeSoft}`,
              padding: 8, display: 'flex', flexDirection: 'column', gap: 5,
            }}>
              <div style={{ display: 'flex', gap: 4 }}>
                <div style={{ width: 18, height: 6, background: t.accent, borderRadius: 1 }}/>
                <div style={{ width: 28, height: 6, background: t.fg, opacity: 0.4, borderRadius: 1 }}/>
              </div>
              <div style={{ width: '80%', height: 5, background: t.fg, opacity: 0.8, borderRadius: 1 }}/>
              <div style={{ width: '60%', height: 5, background: t.fg, opacity: 0.5, borderRadius: 1 }}/>
              <div style={{ flex: 1 }}/>
              <div style={{ width: '40%', height: 4, background: t.accent, opacity: 0.8, borderRadius: 1 }}/>
            </div>
            <div style={{ marginTop: 6, fontSize: 11, color: theme === t.id ? T.amber : T.fg2,
              fontWeight: 500 }}>{t.label}</div>
          </button>
        ))}
      </div>

      <Row label="Font family" hint="Controls UI typography across the app.">
        <Select value="Inter" options={['Inter','SF Pro','System']}/>
      </Row>
      <Row label="Editor font" hint="Used for code and response bodies.">
        <Select value="JetBrains Mono"/>
      </Row>
      <Row label="UI density" hint="Comfortable, cozy, or compact.">
        <Select value="Comfortable"/>
      </Row>
      <Row label="Accent color" hint="Amber by default.">
        <div style={{ display: 'flex', gap: 6 }}>
          {['#e6c188','#f97758','#4ae176','#60a5fa','#c084fc','#f472b6'].map((c,i) => (
            <span key={i} style={{
              width: 18, height: 18, borderRadius: 9999, background: c,
              boxShadow: i === 0 ? `0 0 0 2px rgba(230,193,136,0.25), inset 0 0 0 1px rgba(0,0,0,0.2)`
                                 : `inset 0 0 0 1px rgba(0,0,0,0.2)`,
            }}/>
          ))}
        </div>
      </Row>
      <Row label="Reduce motion">
        <Toggle/>
      </Row>
    </div>
  );
}

function GeneralPage() {
  return (
    <div>
      <PageTitle note="Defaults for new collections and the app at large.">General</PageTitle>
      <Row label="Default request method"><Select value="GET"/></Row>
      <Row label="Request timeout" hint="Abort if no response after N seconds."><Select value="30s"/></Row>
      <Row label="Follow redirects"><Toggle on={true}/></Row>
      <Row label="Verify SSL certs"><Toggle on={true}/></Row>
      <Row label="Save history" hint="Keep a local record of every response."><Toggle on={true}/></Row>
      <Row label="Open last collection on launch"><Toggle on={true}/></Row>
      <Row label="Check for updates"><Select value="Weekly"/></Row>
    </div>
  );
}

function KeyboardPage() {
  const shortcuts = [
    ['Command palette',    ['⌘','K']],
    ['Send request',       ['⌘','Return']],
    ['New request',        ['⌘','N']],
    ['Close tab',          ['⌘','W']],
    ['Next tab',           ['⌃','Tab']],
    ['Jump to request',    ['⌘','P']],
    ['Jump to env',        ['⌘','E']],
    ['Toggle sidebar',     ['⌘','\\']],
    ['Find in response',   ['⌘','F']],
    ['Run test suite',     ['⌘','⇧','T']],
  ];
  return (
    <div>
      <PageTitle note="Click any shortcut to rebind.">Keyboard</PageTitle>
      {shortcuts.map(([label, keys]) => (
        <Row key={label} label={label}>
          <div style={{ display: 'flex', gap: 3 }}>
            {keys.map((k,i) => <Kbd key={i}>{k}</Kbd>)}
          </div>
        </Row>
      ))}
    </div>
  );
}

function AIPage() {
  return (
    <div>
      <PageTitle note="Invoker can draft requests, generate assertions, and explain responses.">AI assistance</PageTitle>
      <Row label="Enable AI features"><Toggle on={true}/></Row>
      <Row label="Provider" hint="Your own key, stored in the system keychain.">
        <Select value="Anthropic"/>
      </Row>
      <Row label="Model"><Select value="claude-haiku-4-5"/></Row>
      <div style={{
        marginTop: 18, padding: 12, borderRadius: 8,
        background: T.s3, boxShadow: `inset 0 0 0 1px ${T.strokeSoft}`,
        display: 'flex', gap: 10,
      }}>
        <I.Sparkle size={16} style={{ color: T.amber, marginTop: 1, flexShrink: 0 }}/>
        <div style={{ fontSize: 12, color: T.fg2, lineHeight: 1.5 }}>
          AI never sees your env values unless you explicitly include them.
          Request bodies and responses stay on your machine by default.
        </div>
      </div>
    </div>
  );
}

function DataPage() {
  return (
    <div>
      <PageTitle note="Everything lives on disk as .ivk files. Sync is opt-in.">Data & sync</PageTitle>
      <Row label="Collections path" hint="~/Code/invoker-collections">
        <button style={{ ...secondaryBtn, padding: '4px 10px', fontSize: 11 }}>Reveal…</button>
      </Row>
      <Row label="Keep history for"><Select value="90 days"/></Row>
      <Row label="Redact secrets from history"><Toggle on={true}/></Row>
      <Row label="Export all data as JSON">
        <button style={{ ...secondaryBtn, padding: '4px 10px', fontSize: 11 }}>Export…</button>
      </Row>
      <Row label="Sync via Git" hint="Commit the folder to your own repo.">
        <Toggle on={true}/>
      </Row>
    </div>
  );
}

function AccountPage() {
  return (
    <div>
      <PageTitle note="Invoker is local-first. An account only unlocks team features.">Account</PageTitle>
      <div style={{
        padding: 14, borderRadius: 10,
        background: T.s3, boxShadow: `inset 0 0 0 1px ${T.strokeSoft}`,
        display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 9999,
          background: `linear-gradient(135deg, ${T.amber} 0%, ${T.red} 100%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#0a0a0a', fontWeight: 700, fontSize: 14,
        }}>d</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.fg1 }}>doossee</div>
          <div style={{ fontSize: 11, color: T.fg3 }}>doossee@outlook.com · Personal plan</div>
        </div>
        <button style={{ ...secondaryBtn, padding: '4px 10px', fontSize: 11 }}>Manage…</button>
      </div>
      <Row label="Team workspace" hint="Share collections, envs, history.">
        <button style={{ ...secondaryBtn, padding: '4px 10px', fontSize: 11 }}>Create…</button>
      </Row>
      <Row label="Sign out">
        <button style={{ ...secondaryBtn, padding: '4px 10px', fontSize: 11, color: T.red }}>Sign out</button>
      </Row>
    </div>
  );
}

// =========================================================================
// Env settings — full-bleed variables table.
// =========================================================================

function EnvSettings() {
  const envs = [
    { id: 'dev', label: 'development', active: true },
    { id: 'stg', label: 'staging', active: false },
    { id: 'prd', label: 'production', active: false },
  ];
  const [active, setActive] = React.useState('dev');

  const vars = {
    dev: [
      { k: 'baseUrl',   v: 'https://api.dev.acme.io',          secret: false },
      { k: 'apiKey',    v: 'sk_dev_9f83a21c4b8e0d7f',          secret: true  },
      { k: 'userId',    v: 'u_9f3a21',                         secret: false },
      { k: 'phone',     v: '+1 415 555 0133',                  secret: false },
      { k: 'code',      v: '000000',                           secret: false },
      { k: 'authToken', v: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXV…', secret: true },
    ],
    stg: [
      { k: 'baseUrl',   v: 'https://api.stg.acme.io',     secret: false },
      { k: 'apiKey',    v: 'sk_stg_••••••••••••••••',      secret: true },
    ],
    prd: [
      { k: 'baseUrl',   v: 'https://api.acme.io',          secret: false },
      { k: 'apiKey',    v: 'sk_prd_••••••••••••••••',      secret: true },
    ],
  };

  const current = vars[active] || [];

  return (
    <ModalFrame width={900} height={560}>
      {/* Header */}
      <div style={{
        padding: '14px 18px 10px', borderBottom: `1px solid ${T.strokeSoft}`,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <I.Database size={16} style={{ color: T.amber }}/>
        <div style={{ fontSize: 14, fontWeight: 600, color: T.fg1 }}>Environments</div>
        <div style={{ fontSize: 11, color: T.fg3 }}>My Collection</div>
        <div style={{ flex: 1 }}/>
        <button style={{ ...secondaryBtn, padding: '5px 10px', fontSize: 11 }}>
          <I.Upload size={11} style={{ marginRight: 5 }}/>Import .env
        </button>
        <button style={{ ...secondaryBtn, padding: '5px 10px', fontSize: 11 }}>
          <I.Download size={11} style={{ marginRight: 5 }}/>Export
        </button>
      </div>

      {/* Env tabs */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 2, padding: '8px 12px',
        borderBottom: `1px solid ${T.strokeSoft}`,
      }}>
        {envs.map(e => (
          <button key={e.id} onClick={() => setActive(e.id)} style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '5px 11px', borderRadius: 6, border: 'none',
            background: active === e.id ? T.s4 : 'transparent',
            color: active === e.id ? T.fg1 : T.fg2,
            fontFamily: "'JetBrains Mono', monospace", fontSize: 11, cursor: 'pointer',
          }}>
            <span style={{
              width: 7, height: 7, borderRadius: 9999,
              background: e.active ? T.green : '#444',
            }}/>
            {e.label}
          </button>
        ))}
        <button style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '5px 10px', borderRadius: 6, border: 'none',
          background: 'transparent', color: T.fg3, fontSize: 11, cursor: 'pointer',
          fontFamily: 'inherit',
        }}>
          <I.Plus size={11}/> New env
        </button>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse',
          fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
          <thead>
            <tr style={{ position: 'sticky', top: 0, background: T.s2, zIndex: 1 }}>
              {['Key','Value','Secret',''].map((h,i) => (
                <th key={i} style={{
                  textAlign: 'left', padding: '8px 14px',
                  fontSize: 10, fontWeight: 600, color: T.fg3,
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  fontFamily: 'Inter, sans-serif',
                  borderBottom: `1px solid ${T.strokeSoft}`,
                  width: i === 0 ? 180 : i === 2 ? 80 : i === 3 ? 40 : 'auto',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {current.map((row, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${T.strokeSoft}` }}>
                <td style={{ padding: '9px 14px', color: T.amber }}>{row.k}</td>
                <td style={{ padding: '9px 14px', color: T.fg1,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 460 }}>
                  {row.secret ? '•'.repeat(Math.min(row.v.length, 28)) : row.v}
                </td>
                <td style={{ padding: '9px 14px' }}>
                  <Toggle on={row.secret}/>
                </td>
                <td style={{ padding: '9px 14px' }}>
                  <button style={{
                    width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'transparent', border: 'none', color: T.fg3, cursor: 'pointer',
                  }}><I.X size={11}/></button>
                </td>
              </tr>
            ))}
            <tr>
              <td colSpan={4} style={{ padding: '9px 14px' }}>
                <button style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'transparent', border: 'none', color: T.fg3,
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 11, cursor: 'pointer',
                }}>
                  <I.Plus size={11}/> Add variable
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footer hint */}
      <div style={{
        padding: '10px 18px', borderTop: `1px solid ${T.strokeSoft}`,
        fontSize: 11, color: T.fg3, display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <I.Zap size={11} style={{ color: T.amber }}/>
        Reference with <span style={codeInline}>{'{{baseUrl}}'}</span> — works in URL, headers, body, params, tests.
      </div>
    </ModalFrame>
  );
}

// =========================================================================
// Command palette — ⌘K overlay.
// =========================================================================

function CommandPalette() {
  const [query, setQuery] = React.useState('aut');

  const results = [
    { type: 'req', method: 'POST', name: 'Auth.login', path: 'auth / login.ivk',    match: [4,3] },
    { type: 'req', method: 'POST', name: 'Auth.logout', path: 'auth / logout.ivk',  match: [0,3] },
    { type: 'req', method: 'GET',  name: 'Auth.getMe', path: 'auth / get-me.ivk',   match: [0,3] },
    { type: 'act', name: 'Switch env → staging',  kbd: null },
    { type: 'act', name: 'Switch env → production', kbd: null },
    { type: 'doc', name: 'Auth README',           path: 'auth / README.md' },
  ];

  return (
    <div style={{
      position: 'relative', width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.65)',
      backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      paddingTop: '12%', fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      {/* Fake shell peek behind */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.15, zIndex: 0,
        background: `repeating-linear-gradient(0deg, ${T.s2} 0 2px, ${T.s1} 2px 4px)`,
      }}/>

      <div style={{
        position: 'relative', zIndex: 1, width: 640, maxWidth: '92%',
        background: T.s2, borderRadius: 12,
        boxShadow: `0 30px 80px rgba(0,0,0,0.7), inset 0 0 0 1px ${T.stroke}`,
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
      }}>
        {/* Input */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '14px 16px', borderBottom: `1px solid ${T.strokeSoft}`,
        }}>
          <I.Search size={14} style={{ color: T.amber }}/>
          <input value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search requests, actions, docs…"
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: T.fg1, fontFamily: 'inherit', fontSize: 15,
            }}/>
          <Kbd>Esc</Kbd>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 380, overflowY: 'auto', padding: '6px 0' }}>
          <Section label="REQUESTS">
            {results.filter(r => r.type === 'req').map((r, i) => (
              <PaletteRow key={i} active={i === 0}>
                <Pill tone={r.method} mono>{r.method}</Pill>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: T.fg1,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <Highlight text={r.name} query={query}/>
                  </div>
                  <div style={{ fontSize: 11, color: T.fg3 }}>{r.path}</div>
                </div>
                {i === 0 && <Kbd>↵</Kbd>}
              </PaletteRow>
            ))}
          </Section>
          <Section label="ACTIONS">
            {results.filter(r => r.type === 'act').map((r, i) => (
              <PaletteRow key={i}>
                <I.Zap size={14} style={{ color: T.amber }}/>
                <div style={{ flex: 1, fontSize: 13, color: T.fg1 }}>{r.name}</div>
              </PaletteRow>
            ))}
          </Section>
          <Section label="DOCS">
            {results.filter(r => r.type === 'doc').map((r, i) => (
              <PaletteRow key={i}>
                <I.Book size={14} style={{ color: T.fg2 }}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: T.fg1 }}>{r.name}</div>
                  <div style={{ fontSize: 11, color: T.fg3 }}>{r.path}</div>
                </div>
              </PaletteRow>
            ))}
          </Section>
        </div>

        {/* Footer */}
        <div style={{
          padding: '9px 14px', borderTop: `1px solid ${T.strokeSoft}`,
          display: 'flex', alignItems: 'center', gap: 16,
          fontSize: 11, color: T.fg3,
        }}>
          <FooterKey keys={['↑','↓']} label="Navigate"/>
          <FooterKey keys={['↵']} label="Open"/>
          <FooterKey keys={['⌘','↵']} label="Open in new tab"/>
          <div style={{ flex: 1 }}/>
          <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>6 results</span>
        </div>
      </div>
    </div>
  );
}

function Section({ label, children }) {
  return (
    <div style={{ padding: '4px 0' }}>
      <div style={{
        padding: '6px 16px 4px', fontSize: 10, fontWeight: 600, color: T.fg4,
        letterSpacing: '0.14em', textTransform: 'uppercase',
        fontFamily: "'JetBrains Mono', monospace",
      }}>{label}</div>
      {children}
    </div>
  );
}

function PaletteRow({ active, children }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 14px', margin: '0 4px', borderRadius: 6,
      background: active ? 'rgba(230,193,136,0.08)' : 'transparent',
      position: 'relative',
    }}>
      {active && <span style={{
        position: 'absolute', left: 0, top: 6, bottom: 6, width: 2,
        background: T.amber, borderRadius: 2,
      }}/>}
      {children}
    </div>
  );
}

function Highlight({ text, query }) {
  if (!query) return text;
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  const parts = [];
  let cursor = 0;
  for (let i = 0; i < q.length; i++) {
    const ch = q[i];
    const idx = lower.indexOf(ch, cursor);
    if (idx === -1) continue;
    if (idx > cursor) parts.push({ t: 'n', v: text.slice(cursor, idx) });
    parts.push({ t: 'h', v: text[idx] });
    cursor = idx + 1;
  }
  if (cursor < text.length) parts.push({ t: 'n', v: text.slice(cursor) });
  return (
    <>
      {parts.map((p, i) =>
        p.t === 'h'
          ? <span key={i} style={{ color: T.amber, fontWeight: 600 }}>{p.v}</span>
          : <span key={i}>{p.v}</span>
      )}
    </>
  );
}

function Pill({ tone, mono, children }) {
  const map = { GET: T.green, POST: T.amber, PUT: T.blue, DEL: T.red, PATCH: T.yellow };
  const color = map[tone] || T.fg2;
  return (
    <span style={{
      fontFamily: mono ? "'JetBrains Mono', monospace" : 'inherit',
      fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
      color, background: `${color}14`,
      padding: '2px 6px', borderRadius: 4,
      minWidth: 36, textAlign: 'center',
    }}>{children}</span>
  );
}

function FooterKey({ keys, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      {keys.map((k,i) => <Kbd key={i}>{k}</Kbd>)}
      <span style={{ marginLeft: 2 }}>{label}</span>
    </div>
  );
}

// =========================================================================
// First run — welcome onboarding after install.
// =========================================================================

function FirstRun() {
  const [step, setStep] = React.useState(0);

  return (
    <div style={{
      width: '100%', height: '100%',
      background: 'radial-gradient(ellipse at 20% 10%, #1a1612 0%, #050505 60%)',
      color: T.fg1, fontFamily: 'Inter, system-ui, sans-serif',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: 40,
    }}>
      <div style={{ width: 720, maxWidth: '100%', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 22 }}>
          <InvokerMark size={44}/>
        </div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
          color: T.fg3, letterSpacing: '0.24em', textTransform: 'uppercase', marginBottom: 10 }}>
          {['Welcome','Pick a source','Set defaults','You\'re set'][step]}
        </div>
        <div style={{
          fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 40,
          letterSpacing: '-0.02em', color: T.fg1, lineHeight: 1.05, marginBottom: 14,
        }}>
          {[
            'A request tool that finally feels local.',
            'Where do your requests live?',
            'Fast defaults for every new request.',
            'Send your first one.',
          ][step]}
        </div>
        <div style={{ color: T.fg2, fontSize: 15, lineHeight: 1.5, maxWidth: 520, margin: '0 auto 32px' }}>
          {[
            'Invoker keeps everything on your disk as plain text. Git-friendly. Docs-native. No sign-in.',
            'Open a folder you already have, clone from Git, or start fresh. You can switch later.',
            'Tune once, never think about it. Every value here is editable in Settings.',
            'Press ⌘K any time. Everything else is discoverable from the sidebar.',
          ][step]}
        </div>

        {step === 1 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 28 }}>
            <SourceCard icon={<I.FolderOpen size={18}/>} title="Open folder"
              note=".ivk files on disk"/>
            <SourceCard icon={<I.Download size={18}/>} title="Clone from Git"
              note="HTTPS or SSH"/>
            <SourceCard icon={<I.FolderPlus size={18}/>} title="New collection"
              note="Start fresh" accent/>
          </div>
        )}

        {step === 2 && (
          <div style={{
            textAlign: 'left', background: T.s2, borderRadius: 12,
            boxShadow: `inset 0 0 0 1px ${T.strokeSoft}`,
            padding: '6px 22px', marginBottom: 28,
          }}>
            <Row label="Default method"><Select value="GET"/></Row>
            <Row label="Timeout"><Select value="30s"/></Row>
            <Row label="Save history"><Toggle on={true}/></Row>
            <Row label="Enable AI"><Toggle on={true}/></Row>
          </div>
        )}

        {step === 3 && (
          <div style={{
            textAlign: 'left', background: T.s2, borderRadius: 12,
            boxShadow: `inset 0 0 0 1px ${T.strokeSoft}`,
            padding: 18, marginBottom: 28, display: 'flex', gap: 10, alignItems: 'center',
          }}>
            <span style={{
              width: 28, height: 28, borderRadius: 9999, background: 'rgba(74,225,118,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.green,
            }}><I.Check size={15}/></span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.fg1 }}>Collection opened</div>
              <div style={{ fontSize: 11, color: T.fg3, fontFamily: "'JetBrains Mono', monospace" }}>
                ~/Code/acme-collection · 14 requests, 2 envs
              </div>
            </div>
            <Kbd>⌘</Kbd><Kbd>K</Kbd>
          </div>
        )}

        {/* Step indicator + nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <button onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} style={{
            ...secondaryBtn, padding: '8px 14px', opacity: step === 0 ? 0.3 : 1,
          }}>
            <I.ChevLeft size={12} style={{ marginRight: 4 }}/>Back
          </button>

          <div style={{ display: 'flex', gap: 6, margin: '0 14px' }}>
            {[0,1,2,3].map(i => (
              <span key={i} style={{
                width: i === step ? 22 : 6, height: 6, borderRadius: 9999,
                background: i <= step ? T.amber : T.s4,
                transition: 'width 0.2s',
              }}/>
            ))}
          </div>

          <button onClick={() => setStep(Math.min(3, step + 1))} style={{
            ...primaryBtn, padding: '8px 16px',
          }}>
            {step === 3 ? 'Open Invoker' : 'Continue'}
            <I.ArrowRight size={12} style={{ marginLeft: 6 }}/>
          </button>
        </div>

        <div style={{ marginTop: 24, fontSize: 11, color: T.fg4 }}>
          Local-first · Git-native · No account needed
        </div>
      </div>
    </div>
  );
}

function SourceCard({ icon, title, note, accent }) {
  return (
    <button style={{
      padding: '18px 16px', borderRadius: 12,
      background: accent ? 'rgba(230,193,136,0.06)' : T.s2,
      boxShadow: accent
        ? `inset 0 0 0 1px rgba(230,193,136,0.45)`
        : `inset 0 0 0 1px ${T.strokeSoft}`,
      border: 'none', cursor: 'pointer', textAlign: 'left',
      color: T.fg1, fontFamily: 'inherit',
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <span style={{ color: accent ? T.amber : T.fg2 }}>{icon}</span>
      <div style={{ fontSize: 14, fontWeight: 600, color: accent ? T.amber : T.fg1 }}>{title}</div>
      <div style={{ fontSize: 11, color: T.fg3 }}>{note}</div>
    </button>
  );
}
