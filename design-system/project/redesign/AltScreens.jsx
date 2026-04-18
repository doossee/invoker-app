// Alternate variations of the two main screens.
// MainShellDense  — vertical rail + collapsed tree, more horizontal pixels for code
// WelcomeEditorial — single-column, docs-first, softer

// =========================================================================
// MainShellDense — rail sidebar, single editor column with collapsible request list
// =========================================================================

function MainShellDense() {
  return (
    <div style={{ height: '100%', display: 'flex',
      background: T.s1, color: T.fg1,
      fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Icon rail */}
      <div style={{
        width: 48, background: T.s2, borderRight: `1px solid ${T.strokeSoft}`,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '10px 0', gap: 4,
      }}>
        <RailItem icon={<I.FolderOpen size={16}/>} active/>
        <RailItem icon={<I.Book size={16}/>}/>
        <RailItem icon={<I.Clock size={16}/>}/>
        <RailItem icon={<I.Database size={16}/>}/>
        <div style={{ flex: 1 }}/>
        <RailItem icon={<I.Sparkle size={16}/>}/>
        <RailItem icon={<I.Settings size={16}/>}/>
      </div>

      {/* Collapsed request list */}
      <div style={{
        width: 44, background: T.s2, borderRight: `1px solid ${T.strokeSoft}`,
        padding: '10px 0', display: 'flex', flexDirection: 'column', gap: 2,
      }}>
        {[
          { m: 'POST', name: 'login',   active: true },
          { m: 'GET',  name: 'get-me' },
          { m: 'POST', name: 'logout' },
          { m: 'GET',  name: 'list' },
          { m: 'POST', name: 'create' },
          { m: 'PUT',  name: 'update' },
          { m: 'DEL',  name: 'delete' },
          { m: 'GET',  name: 'health' },
        ].map((r,i) => (
          <button key={i} title={r.name} style={{
            width: 36, height: 28, margin: '0 auto',
            background: r.active ? 'rgba(230,193,136,0.08)' : 'transparent',
            border: 'none', borderRadius: 5,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', position: 'relative',
            fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700,
            color: r.m === 'GET' ? T.green : r.m === 'POST' ? T.amber :
                   r.m === 'PUT' ? T.blue : r.m === 'DEL' ? T.red : T.fg2,
          }}>
            {r.active && <span style={{
              position: 'absolute', left: 0, top: 4, bottom: 4, width: 2,
              background: T.amber, borderRadius: 2,
            }}/>}
            {r.m}
          </button>
        ))}
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Tabs */}
        <div style={{
          height: 34, display: 'flex', alignItems: 'center',
          borderBottom: `1px solid ${T.strokeSoft}`, paddingLeft: 4,
        }}>
          {[
            { m: 'POST', n: 'auth/login', active: true, dirty: true },
            { m: 'GET',  n: 'auth/get-me', active: false },
          ].map((t,i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '0 12px', height: 28, borderRadius: 5,
              background: t.active ? T.s3 : 'transparent',
              fontSize: 12, color: t.active ? T.fg1 : T.fg3, margin: '0 1px',
            }}>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700,
                color: t.m === 'GET' ? T.green : T.amber,
              }}>{t.m}</span>
              <span>{t.n}</span>
              {t.dirty && <span style={{ width: 5, height: 5, borderRadius: 9999, background: T.fg3 }}/>}
              <I.X size={10} style={{ color: T.fg4, marginLeft: 2 }}/>
            </div>
          ))}
          <div style={{ flex: 1 }}/>
          <div style={{ paddingRight: 10, display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 10, color: T.fg3, fontFamily: "'JetBrains Mono', monospace" }}>
            <span style={{ width: 6, height: 6, borderRadius: 9999, background: T.green }}/>
            development
          </div>
        </div>

        {/* Request bar — full width */}
        <div style={{ padding: '10px 12px', borderBottom: `1px solid ${T.strokeSoft}` }}>
          <div style={{
            display: 'flex', alignItems: 'center',
            background: T.s3, borderRadius: 8, height: 34,
            boxShadow: `inset 0 0 0 1px ${T.stroke}`, overflow: 'hidden',
          }}>
            <button style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '0 12px', height: '100%', background: 'transparent',
              color: T.amber, border: 'none',
              borderRight: `1px solid ${T.strokeSoft}`,
              fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700,
              cursor: 'pointer',
            }}>POST <I.ChevDown size={10} style={{ color: T.fg3 }}/></button>
            <div style={{ flex: 1, padding: '0 12px',
              fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              <VarText text="{{baseUrl}}/auth/login"/>
            </div>
            <button style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '0 14px', height: '100%', background: T.amber,
              color: '#0a0a0a', border: 'none', fontFamily: 'inherit',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}>
              <I.Send size={11}/> Send
              <span style={{
                marginLeft: 6, paddingLeft: 6, borderLeft: '1px solid rgba(0,0,0,0.15)',
                fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 500,
              }}>⌘↵</span>
            </button>
          </div>
        </div>

        {/* Editor — split horizontal: params above, response below */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{
            flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr',
            borderBottom: `1px solid ${T.strokeSoft}`, minHeight: 0,
          }}>
            <div style={{ borderRight: `1px solid ${T.strokeSoft}`, display: 'flex', flexDirection: 'column' }}>
              <div style={{
                padding: '6px 12px', fontSize: 10, color: T.fg3,
                fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.1em',
                textTransform: 'uppercase', borderBottom: `1px solid ${T.strokeSoft}`,
              }}>Body · json</div>
              <pre style={{
                margin: 0, padding: '12px 14px', fontSize: 13,
                fontFamily: "'JetBrains Mono', monospace", color: T.fg1,
                lineHeight: 1.65, overflow: 'auto', flex: 1,
              }}>{`{
  "jsonrpc": "2.0",
  "method": "Auth.login",
  "params": {
    "phone": "`}<span style={{ color: T.amber, background: 'rgba(230,193,136,0.1)' }}>{`{{phone}}`}</span>{`",
    "code":  "`}<span style={{ color: T.amber, background: 'rgba(230,193,136,0.1)' }}>{`{{code}}`}</span>{`"
  },
  "id": 1
}`}</pre>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{
                padding: '6px 12px', fontSize: 10, color: T.fg3,
                fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.1em',
                textTransform: 'uppercase', borderBottom: `1px solid ${T.strokeSoft}`,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                Response
                <span style={{ color: T.green, background: 'rgba(74,225,118,0.12)',
                  padding: '1px 5px', borderRadius: 3, fontWeight: 700 }}>200</span>
                <span>287 ms</span>
                <span style={{ color: T.fg4 }}>·</span>
                <span>1.4 KB</span>
              </div>
              <pre style={{
                margin: 0, padding: '12px 14px', fontSize: 13,
                fontFamily: "'JetBrains Mono', monospace", color: T.fg1,
                lineHeight: 1.65, overflow: 'auto', flex: 1,
              }}>{`{
  "result": {
    "id": "u_9f3a21",
    "phone": "+1 415 555 0133",
    "role": "user",
    "createdAt": "2026-04-18T10:32:14Z"
  },
  "jsonrpc": "2.0",
  "id": 1
}`}</pre>
            </div>
          </div>

          {/* Tests / scripts strip */}
          <div style={{
            height: 120, display: 'flex', flexDirection: 'column',
            background: T.s2,
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 2, padding: '6px 10px',
              borderBottom: `1px solid ${T.strokeSoft}`,
            }}>
              {['Tests (3 passed)', 'Console', 'Vars', 'History'].map((t,i) => (
                <button key={i} style={{
                  padding: '4px 10px', borderRadius: 5, border: 'none',
                  background: i === 0 ? T.s4 : 'transparent',
                  color: i === 0 ? T.fg1 : T.fg3,
                  fontFamily: 'inherit', fontSize: 11, cursor: 'pointer',
                }}>{t}</button>
              ))}
              <div style={{ flex: 1 }}/>
              <I.Terminal size={11} style={{ color: T.fg3, marginRight: 8 }}/>
            </div>
            <div style={{ flex: 1, padding: '8px 14px', overflow: 'auto',
              fontFamily: "'JetBrains Mono', monospace", fontSize: 12, lineHeight: 1.7 }}>
              <TestRow ok label="status === 200"/>
              <TestRow ok label="response.result.id exists"/>
              <TestRow ok label="authToken saved to env"/>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RailItem({ icon, active }) {
  return (
    <button style={{
      width: 32, height: 32, borderRadius: 7, border: 'none',
      background: active ? 'rgba(230,193,136,0.1)' : 'transparent',
      color: active ? T.amber : T.fg3, cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative',
    }}>
      {active && <span style={{
        position: 'absolute', left: -8, top: 7, bottom: 7, width: 2,
        background: T.amber, borderRadius: 2,
      }}/>}
      {icon}
    </button>
  );
}

function TestRow({ ok, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: T.fg2 }}>
      <span style={{
        width: 14, height: 14, borderRadius: 9999,
        background: ok ? 'rgba(74,225,118,0.15)' : 'rgba(249,119,88,0.15)',
        color: ok ? T.green : T.red,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {ok ? <I.Check size={8}/> : <I.X size={8}/>}
      </span>
      {label}
    </div>
  );
}

// =========================================================================
// WelcomeEditorial — single-column, editorial, docs-first
// =========================================================================

function WelcomeEditorial() {
  return (
    <div style={{
      height: '100%', overflow: 'auto',
      background: T.s1, color: T.fg1,
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '72px 32px 80px' }}>

        {/* Mark + wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 44 }}>
          <InvokerMark size={30}/>
          <div>
            <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700,
              fontSize: 18, letterSpacing: '-0.01em', color: T.fg1 }}>Invoker</div>
            <div style={{ fontSize: 11, color: T.fg3,
              fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.12em' }}>v2.4.1</div>
          </div>
          <div style={{ flex: 1 }}/>
          <button style={{ ...secondaryBtn, padding: '6px 12px' }}>
            <I.Settings size={12} style={{ marginRight: 6 }}/>Settings
          </button>
        </div>

        <div style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: T.amber,
          letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 14,
        }}>A git-native API workspace</div>

        <h1 style={{
          fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 48,
          letterSpacing: '-0.02em', color: T.fg1, margin: '0 0 20px',
          lineHeight: 1.05,
        }}>
          <span style={{ color: T.fg3 }}>Requests as</span> source code.
        </h1>

        <p style={{
          fontSize: 17, color: T.fg2, lineHeight: 1.55, maxWidth: 560,
          margin: '0 0 48px',
        }}>
          Open any folder of <em style={{ color: T.fg1, fontStyle: 'normal',
            fontFamily: "'JetBrains Mono', monospace", fontSize: 15,
            background: T.s3, padding: '1px 6px', borderRadius: 4 }}>.ivk</em> and
          <em style={{ color: T.fg1, fontStyle: 'normal',
            fontFamily: "'JetBrains Mono', monospace", fontSize: 15,
            background: T.s3, padding: '1px 6px', borderRadius: 4, marginLeft: 6 }}>README.md</em> files.
          Everything stays on your disk. No accounts, no cloud.
        </p>

        {/* Resume strip */}
        <div style={{
          padding: 16, borderRadius: 12,
          background: T.s2, boxShadow: `inset 0 0 0 1px ${T.strokeSoft}`,
          marginBottom: 48,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            fontSize: 11, color: T.fg3, marginBottom: 14,
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: '0.1em', textTransform: 'uppercase',
          }}>
            <I.Clock size={11} style={{ color: T.amber }}/>
            Recent collections
          </div>
          {[
            { n: 'acme-collection',  p: '~/work/acme/api-docs',      s: '2 h ago',  reqs: 23, docs: 6 },
            { n: 'stripe-playbook',  p: '~/work/stripe-playbook',    s: 'yesterday', reqs: 127, docs: 14 },
            { n: 'personal',         p: '~/code/invoker-personal',   s: '3 d ago',  reqs: 8,   docs: 2 },
          ].map((r,i) => (
            <button key={i} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 4px', background: 'transparent', border: 'none',
              borderBottom: i < 2 ? `1px solid ${T.strokeSoft}` : 'none',
              color: T.fg1, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
            }}>
              <I.Folder size={14} style={{ color: T.yellow, flexShrink: 0 }}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, color: T.fg1, fontWeight: 500 }}>{r.n}</div>
                <div style={{ fontSize: 11, color: T.fg3,
                  fontFamily: "'JetBrains Mono', monospace" }}>{r.p}</div>
              </div>
              <span style={{ fontSize: 11, color: T.fg3 }}>
                {r.reqs} reqs · {r.docs} docs
              </span>
              <span style={{ fontSize: 11, color: T.fg3, minWidth: 70, textAlign: 'right' }}>{r.s}</span>
              <I.ArrowRight size={12} style={{ color: T.fg3 }}/>
            </button>
          ))}
        </div>

        {/* Three simple actions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 48 }}>
          {[
            { icon: <I.FolderOpen size={14}/>, title: 'Open folder', kbd: '⌘O' },
            { icon: <I.Send size={14}/>,       title: 'New request', kbd: '⌘N' },
            { icon: <I.Search size={14}/>,     title: 'Command palette', kbd: '⌘K' },
          ].map((a,i) => (
            <button key={i} style={{
              padding: '14px 16px', borderRadius: 10,
              background: 'transparent',
              boxShadow: `inset 0 0 0 1px ${T.strokeSoft}`,
              border: 'none', cursor: 'pointer', color: T.fg1,
              fontFamily: 'inherit', textAlign: 'left',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ color: T.amber, display: 'flex' }}>{a.icon}</span>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{a.title}</span>
              <Kbd>{a.kbd}</Kbd>
            </button>
          ))}
        </div>

        {/* Editorial quote block / philosophy */}
        <div style={{
          padding: '24px 28px', borderRadius: 12,
          background: T.s2, boxShadow: `inset 0 0 0 1px ${T.strokeSoft}`,
          marginBottom: 44,
        }}>
          <div style={{
            fontFamily: 'Manrope, sans-serif', fontWeight: 500, fontSize: 20,
            color: T.fg1, lineHeight: 1.4, letterSpacing: '-0.005em',
            marginBottom: 14,
          }}>
            “Requests are source code. They should live next to the code that calls them.”
          </div>
          <div style={{ fontSize: 12, color: T.fg3 }}>
            — Invoker's single design axiom. Everything else follows.
          </div>
        </div>

        {/* Tips strip */}
        <div>
          <div style={{
            fontSize: 11, color: T.fg3, marginBottom: 12,
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: '0.1em', textTransform: 'uppercase',
          }}>Did you know</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {[
              ['Any folder with a README.md becomes browsable docs.', null],
              ['Pre-request scripts run in a sandboxed V8 — you can import crypto.', 'Learn'],
              ['`npm run invoker:build` ships a static docs site to any host.', 'Learn'],
            ].map(([tip, cta], i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 0', borderBottom: i < 2 ? `1px solid ${T.strokeSoft}` : 'none',
              }}>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                  color: T.fg4, minWidth: 22,
                }}>{String(i + 1).padStart(2, '0')}</span>
                <div style={{ flex: 1, fontSize: 14, color: T.fg2, lineHeight: 1.5 }}>{tip}</div>
                {cta && <a href="#" style={{ fontSize: 12, color: T.amber,
                  textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
                  {cta}<I.ArrowRight size={10}/>
                </a>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
