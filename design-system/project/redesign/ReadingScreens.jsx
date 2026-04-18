// Reading screens: DocsView (in-app README rendering) + PublishedSite (static site output).

// =========================================================================
// DocsView — in-app docs view.
// Renders a README.md inside a folder, with inline runnable .ivk blocks.
// =========================================================================

function DocsView() {
  return (
    <div style={{
      height: '100%', display: 'flex',
      background: T.s1, color: T.fg1,
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      {/* Sidebar echo — tells the viewer this is inside the app */}
      <div style={{
        width: 220, background: T.s2, padding: '12px 10px',
        borderRight: `1px solid ${T.strokeSoft}`,
        display: 'flex', flexDirection: 'column', gap: 1, flexShrink: 0,
      }}>
        <div style={{ padding: '6px 10px', fontSize: 11, color: T.fg4,
          fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.1em',
          textTransform: 'uppercase', marginBottom: 4 }}>my collection</div>
        {[
          { name: 'Getting Started.md', icon: <I.File size={12}/>, color: T.fg2 },
          { name: 'auth/',         icon: <I.FolderOpen size={12} style={{ color: T.yellow }}/>, color: T.amber, active: true, hasReadme: true },
          { name: 'login.ivk',     method: 'POST', color: T.amber, indent: true },
          { name: 'get-me.ivk',    method: 'GET',  color: T.green, indent: true },
          { name: 'logout.ivk',    method: 'POST', color: T.amber, indent: true },
          { name: 'users/',        icon: <I.Folder size={12} style={{ color: T.yellow }}/>, color: T.fg1, hasReadme: true },
          { name: 'health.ivk',    method: 'GET',  color: T.green },
        ].map((n, i) => (
          <button key={i} style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '5px 10px', paddingLeft: n.indent ? 24 : 10,
            borderRadius: 5, border: 'none', textAlign: 'left',
            background: n.active ? 'rgba(230,193,136,0.08)' : 'transparent',
            color: n.active ? T.amber : n.color || T.fg2, fontSize: 12, cursor: 'pointer',
            fontFamily: 'inherit', position: 'relative',
          }}>
            {n.active && <span style={{
              position: 'absolute', left: 0, top: 4, bottom: 4, width: 2, borderRadius: 2, background: T.amber,
            }}/>}
            {n.method ? (
              <span style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 8, fontWeight: 700,
                color: n.method === 'GET' ? T.green : T.amber,
                letterSpacing: '0.04em', minWidth: 24,
              }}>{n.method}</span>
            ) : n.icon}
            <span style={{ flex: 1 }}>{n.name}</span>
            {n.hasReadme && <I.Book size={10} style={{ color: n.active ? T.amber : 'rgba(118,117,117,0.55)' }}/>}
          </button>
        ))}
      </div>

      {/* Main reader */}
      <div style={{ flex: 1, overflow: 'auto', padding: '40px 56px 80px',
        display: 'flex', justifyContent: 'center' }}>
        <article style={{ maxWidth: 720, width: '100%' }}>
          {/* Breadcrumb */}
          <div style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
            color: T.fg3, marginBottom: 18,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <I.Folder size={11} style={{ color: T.yellow }}/>
            <span>my-collection</span>
            <span style={{ color: T.fg4 }}>/</span>
            <span>auth</span>
            <span style={{ color: T.fg4 }}>/</span>
            <span style={{ color: T.fg2, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <I.Book size={10}/>README.md
            </span>
            <span style={{ flex: 1 }}/>
            <span style={{
              padding: '2px 7px', background: T.s3, borderRadius: 4,
              color: T.fg3, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase',
            }}>Folder docs</span>
          </div>

          <h1 style={{
            fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 38,
            letterSpacing: '-0.02em', color: T.fg1, margin: '0 0 8px', lineHeight: 1.1,
          }}>Authentication</h1>
          <div style={{ fontSize: 15, color: T.fg2, lineHeight: 1.55, marginBottom: 28 }}>
            Login, logout, and identity endpoints. Every <code style={codeInline}>.ivk</code> block
            below is runnable inline — Invoker picks up the surrounding folder's env and auth.
          </div>

          {/* Metadata strip */}
          <div style={{
            display: 'flex', gap: 18, flexWrap: 'wrap', padding: '12px 16px',
            background: T.s2, borderRadius: 10,
            boxShadow: `inset 0 0 0 1px ${T.strokeSoft}`,
            marginBottom: 36,
          }}>
            <MetaItem label="Base URL" value="{{baseUrl}}" mono/>
            <MetaItem label="Auth" value="Bearer {{authToken}}" mono/>
            <MetaItem label="Env" value="development" dot={T.green}/>
            <MetaItem label="Maintainer" value="auth-squad"/>
          </div>

          <H2>Get started</H2>
          <P>
            Invoker keeps secrets per-environment. Switch the env dropdown in the bottom-left,
            then run any request. If your env is missing a variable, the request bar highlights
            the offending <code style={codeInline}>{'{{placeholder}}'}</code> in red.
          </P>

          <H2>Log in</H2>
          <P>Exchanges a phone + code for a bearer token. The token is saved to <code style={codeInline}>{'{{authToken}}'}</code> via the test script.</P>

          <IvkBlock
            method="POST"
            url="{{baseUrl}}/auth/login"
            body={[
              '{',
              '  "jsonrpc": "2.0",',
              '  "method": "Auth.login",',
              '  "params": { "phone": "{{phone}}", "code": "{{code}}" },',
              '  "id": 1',
              '}',
            ]}
            status="200 OK"
            ms="287"
            responsePreview={[
              '{ "result": { "id": "u_9f3a21", "phone": "+1 415 555 0133",',
              '              "role": "user", "createdAt": "2026-04-18T10:32:14Z" },',
              '  "jsonrpc": "2.0", "id": 1 }',
            ]}
          />

          <H2>Who am I</H2>
          <P>Verifies the token and returns the current user.</P>
          <IvkBlock
            method="GET"
            url="{{baseUrl}}/auth/me"
            headers={['Authorization: Bearer {{authToken}}']}
            status="200 OK"
            ms="94"
            responsePreview={[
              '{ "id": "u_9f3a21", "email": "doossee@outlook.com",',
              '  "role": "user", "plan": "personal" }',
            ]}
          />

          <Callout icon={<I.Zap size={14}/>}>
            Run requests inline with <Kbd>⌘</Kbd><Kbd>↵</Kbd>. The last response is cached
            per-session — reload to clear.
          </Callout>

          <H2>Errors</H2>
          <P>The API returns JSON-RPC style errors. Common codes:</P>
          <table style={{
            width: '100%', borderCollapse: 'collapse', marginBottom: 24,
            fontSize: 13, background: T.s2, borderRadius: 8, overflow: 'hidden',
            boxShadow: `inset 0 0 0 1px ${T.strokeSoft}`,
          }}>
            <thead>
              <tr>
                {['Code','Meaning','When'].map((h,i) => (
                  <th key={i} style={{
                    textAlign: 'left', padding: '10px 14px',
                    fontSize: 10, fontWeight: 600, color: T.fg3,
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                    borderBottom: `1px solid ${T.strokeSoft}`,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['-32001','INVALID_CODE','OTP expired or wrong'],
                ['-32002','RATE_LIMITED','>5 attempts in 60s'],
                ['-32003','UNAUTHENTICATED','Missing or invalid bearer'],
              ].map((row,i) => (
                <tr key={i} style={{ borderBottom: i < 2 ? `1px solid ${T.strokeSoft}` : 'none' }}>
                  <td style={{ padding: '10px 14px', fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 12, color: T.red }}>{row[0]}</td>
                  <td style={{ padding: '10px 14px', fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 12, color: T.fg1 }}>{row[1]}</td>
                  <td style={{ padding: '10px 14px', color: T.fg2 }}>{row[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{
            marginTop: 50, paddingTop: 20, borderTop: `1px solid ${T.strokeSoft}`,
            display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: T.fg3,
          }}>
            <I.Clock size={12}/>
            <span>Last edited 4 hours ago by doossee ·</span>
            <a href="#" style={{ color: T.amber, textDecoration: 'none' }}>Edit in place</a>
            <span style={{ color: T.fg4 }}>·</span>
            <a href="#" style={{ color: T.amber, textDecoration: 'none' }}>Publish</a>
          </div>
        </article>
      </div>

      {/* Right rail — TOC */}
      <div style={{
        width: 180, padding: '40px 18px', flexShrink: 0,
        borderLeft: `1px solid ${T.strokeSoft}`,
      }}>
        <div style={{ fontSize: 10, color: T.fg4, fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 10 }}>On this page</div>
        {[
          { t: 'Get started', active: false },
          { t: 'Log in', active: true },
          { t: 'Who am I', active: false },
          { t: 'Errors', active: false },
        ].map((i,k) => (
          <a key={k} href="#" style={{
            display: 'block', padding: '4px 0', fontSize: 12,
            color: i.active ? T.amber : T.fg3, textDecoration: 'none',
            borderLeft: `2px solid ${i.active ? T.amber : 'transparent'}`,
            paddingLeft: 10, marginLeft: -12,
          }}>{i.t}</a>
        ))}
      </div>
    </div>
  );
}

function MetaItem({ label, value, mono, dot }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: T.fg4,
        fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.1em',
        textTransform: 'uppercase', marginBottom: 3 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6,
        fontSize: 12, color: T.fg1,
        fontFamily: mono ? "'JetBrains Mono', monospace" : 'inherit' }}>
        {dot && <span style={{ width: 7, height: 7, borderRadius: 9999, background: dot }}/>}
        {value}
      </div>
    </div>
  );
}

function H2({ children }) {
  return (
    <h2 style={{
      fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 20,
      color: T.fg1, margin: '28px 0 10px', letterSpacing: '-0.01em',
    }}>{children}</h2>
  );
}

function P({ children }) {
  return (
    <p style={{ fontSize: 14, color: T.fg2, lineHeight: 1.65, margin: '0 0 14px' }}>
      {children}
    </p>
  );
}

function Callout({ icon, children }) {
  return (
    <div style={{
      display: 'flex', gap: 10, padding: '12px 14px',
      background: 'rgba(230,193,136,0.05)', borderRadius: 8,
      boxShadow: `inset 0 0 0 1px rgba(230,193,136,0.2)`,
      marginBottom: 24, fontSize: 13, color: T.fg2, lineHeight: 1.55,
    }}>
      <span style={{ color: T.amber, flexShrink: 0, marginTop: 2 }}>{icon}</span>
      <div>{children}</div>
    </div>
  );
}

function IvkBlock({ method, url, body, headers, status, ms, responsePreview }) {
  const [tab, setTab] = React.useState('request');
  const methodColor = method === 'GET' ? T.green : method === 'POST' ? T.amber : T.blue;

  return (
    <div style={{
      marginBottom: 22, background: T.s2, borderRadius: 10,
      boxShadow: `inset 0 0 0 1px ${T.strokeSoft}`, overflow: 'hidden',
    }}>
      {/* Request bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 0,
        padding: 8, background: T.s3,
        borderBottom: `1px solid ${T.strokeSoft}`,
      }}>
        <span style={{
          padding: '5px 9px', background: `${methodColor}14`,
          color: methodColor, fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11, fontWeight: 700, borderRadius: 5, marginRight: 8,
        }}>{method}</span>
        <span style={{
          flex: 1, fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
          color: T.fg1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}><VarText text={url}/></span>
        <button style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '5px 11px', background: T.amber, color: '#0a0a0a',
          border: 'none', borderRadius: 5, fontFamily: 'inherit',
          fontSize: 11, fontWeight: 600, cursor: 'pointer',
        }}>
          <I.Play size={10}/> Run
        </button>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 2, padding: '6px 10px',
        borderBottom: `1px solid ${T.strokeSoft}`,
      }}>
        {['request', 'response'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '4px 9px', borderRadius: 5, border: 'none',
            background: tab === t ? T.s4 : 'transparent',
            color: tab === t ? T.fg1 : T.fg3,
            fontFamily: 'inherit', fontSize: 11, cursor: 'pointer',
            textTransform: 'capitalize',
          }}>{t}</button>
        ))}
        <div style={{ flex: 1 }}/>
        {tab === 'response' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10,
            color: T.fg3, fontFamily: "'JetBrains Mono', monospace", paddingRight: 4 }}>
            <span style={{ color: T.green, background: 'rgba(74,225,118,0.12)',
              padding: '1px 6px', borderRadius: 3, fontWeight: 600 }}>{status}</span>
            <span>{ms} ms</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{
        padding: '12px 14px', fontFamily: "'JetBrains Mono', monospace",
        fontSize: 12, lineHeight: 1.65, overflow: 'auto',
      }}>
        {tab === 'request' ? (
          <>
            {headers && headers.map((h,i) => (
              <div key={i} style={{ color: T.fg3 }}>
                <span style={{ color: T.fg2 }}>{h.split(':')[0]}:</span>
                <VarText text={h.split(':').slice(1).join(':')}/>
              </div>
            ))}
            {body && body.map((l,i) => (
              <div key={i} style={{ color: T.fg1 }}><VarText text={l}/></div>
            ))}
          </>
        ) : (
          responsePreview.map((l,i) => (
            <div key={i} style={{ color: T.fg1 }}><VarText text={l}/></div>
          ))
        )}
      </div>
    </div>
  );
}

function VarText({ text }) {
  const parts = text.split(/(\{\{[^}]+\}\})/g);
  return (
    <>{parts.map((p,i) =>
      p.startsWith('{{')
        ? <span key={i} style={{ color: T.amber, background: 'rgba(230,193,136,0.1)',
            padding: '0 2px', borderRadius: 2 }}>{p}</span>
        : <span key={i}>{p}</span>
    )}</>
  );
}

// =========================================================================
// PublishedSite — public-facing static site output (light, reader-first).
// =========================================================================

function PublishedSite() {
  return (
    <div style={{
      height: '100%', overflow: 'auto',
      background: '#f8f5ef', color: '#2a2520',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      {/* Top nav */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 2, background: 'rgba(248,245,239,0.92)',
        backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
        borderBottom: '1px solid rgba(42,37,32,0.08)',
        padding: '14px 40px',
        display: 'flex', alignItems: 'center', gap: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <InvokerMark size={18} color="#2a2520"/>
          <div>
            <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700,
              fontSize: 14, letterSpacing: '-0.01em' }}>Acme API</div>
            <div style={{ fontSize: 10, color: '#8a7e6f',
              fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.1em' }}>v2 · public</div>
          </div>
        </div>
        <div style={{ flex: 1 }}/>
        {['Guides','Reference','Changelog'].map((i,k) => (
          <a key={k} href="#" style={{
            fontSize: 13, color: '#5a4f43', textDecoration: 'none',
            fontWeight: k === 1 ? 600 : 400,
          }}>{i}</a>
        ))}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '5px 10px', background: 'rgba(42,37,32,0.06)',
          borderRadius: 8, fontSize: 12, color: '#8a7e6f', minWidth: 220,
        }}>
          <I.Search size={12}/>
          <span style={{ flex: 1 }}>Search docs…</span>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
            padding: '1px 5px', background: '#fff', borderRadius: 3,
            color: '#5a4f43', boxShadow: 'inset 0 0 0 1px rgba(42,37,32,0.1)',
          }}>⌘K</span>
        </div>
      </div>

      {/* Layout */}
      <div style={{ maxWidth: 1180, margin: '0 auto', display: 'flex', gap: 40,
        padding: '32px 40px 80px' }}>

        {/* Left nav */}
        <nav style={{ width: 200, flexShrink: 0, fontSize: 13 }}>
          {[
            { h: 'Getting started', items: ['Introduction','Authentication','Rate limits'] },
            { h: 'Endpoints', items: ['Auth','Users','Webhooks'], active: 'Auth' },
            { h: 'Guides', items: ['SSO migration','Bulk import'] },
          ].map((sec, i) => (
            <div key={i} style={{ marginBottom: 20 }}>
              <div style={{
                fontFamily: 'Manrope, sans-serif', fontWeight: 700,
                fontSize: 11, color: '#2a2520', letterSpacing: '0.04em',
                textTransform: 'uppercase', marginBottom: 8,
              }}>{sec.h}</div>
              {sec.items.map((it,k) => (
                <a key={k} href="#" style={{
                  display: 'block', padding: '5px 10px', borderRadius: 5,
                  fontSize: 13, color: it === sec.active ? '#b87333' : '#5a4f43',
                  textDecoration: 'none', marginLeft: -10,
                  background: it === sec.active ? 'rgba(184,115,51,0.08)' : 'transparent',
                  fontWeight: it === sec.active ? 500 : 400,
                }}>{it}</a>
              ))}
            </div>
          ))}
        </nav>

        {/* Article */}
        <article style={{ flex: 1, maxWidth: 720 }}>
          <div style={{ fontSize: 12, color: '#8a7e6f',
            fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.06em',
            textTransform: 'uppercase', marginBottom: 10 }}>Endpoints · Auth</div>

          <h1 style={{
            fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 46,
            letterSpacing: '-0.02em', margin: '0 0 12px', lineHeight: 1.05,
          }}>Authentication</h1>
          <p style={{ fontSize: 17, color: '#5a4f43', lineHeight: 1.55,
            margin: '0 0 28px', maxWidth: 600 }}>
            Log in with a phone number and one-time code. All other requests
            require a bearer token in the <code style={paperCode}>Authorization</code> header.
          </p>

          {/* Published request block */}
          <PublishedEndpoint
            method="POST" path="/auth/login"
            desc="Exchange a phone + OTP for a bearer token."
            req={`{
  "phone": "+1 415 555 0133",
  "code": "438211"
}`}
            res={`{
  "token": "eyJhbGciOiJIUzI1NiIsInR5...",
  "user": {
    "id": "u_9f3a21",
    "phone": "+1 415 555 0133",
    "role": "user"
  },
  "expiresAt": "2026-04-19T10:32:14Z"
}`}
          />

          <h2 style={paperH2}>Bearer header</h2>
          <p style={paperP}>
            Every authenticated request includes:
          </p>
          <pre style={paperPre}>Authorization: Bearer eyJhbGciOiJIUzI1NiIs...</pre>

          <h2 style={paperH2}>Token lifetime</h2>
          <p style={paperP}>
            Tokens are valid for 7 days. Refresh using <a href="#" style={paperLink}>POST /auth/refresh</a>
            {' '}at any time during the window.
          </p>

          <PublishedEndpoint
            method="GET" path="/auth/me"
            desc="Return the authenticated user."
            req={null}
            res={`{
  "id": "u_9f3a21",
  "email": "doossee@outlook.com",
  "role": "user",
  "plan": "personal"
}`}
          />

          {/* Footer */}
          <div style={{
            marginTop: 48, paddingTop: 20, borderTop: '1px solid rgba(42,37,32,0.1)',
            display: 'flex', alignItems: 'center',
          }}>
            <div style={{ flex: 1, fontSize: 12, color: '#8a7e6f' }}>
              Built with <span style={{ color: '#b87333', fontWeight: 500 }}>Invoker</span> ·
              <span style={{ marginLeft: 6 }}>Last updated 4h ago</span>
            </div>
            <a href="#" style={{
              display: 'flex', alignItems: 'center', gap: 5,
              fontSize: 12, color: '#5a4f43', textDecoration: 'none',
            }}>
              Edit this page <I.External size={10}/>
            </a>
          </div>
        </article>

        {/* Right TOC */}
        <nav style={{ width: 160, flexShrink: 0, fontSize: 12 }}>
          <div style={{
            fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 11,
            color: '#2a2520', letterSpacing: '0.04em', textTransform: 'uppercase',
            marginBottom: 8,
          }}>On this page</div>
          {[
            ['POST /auth/login', true],
            ['Bearer header', false],
            ['Token lifetime', false],
            ['GET /auth/me', false],
          ].map(([t, active], k) => (
            <a key={k} href="#" style={{
              display: 'block', padding: '3px 0', fontSize: 12,
              color: active ? '#b87333' : '#8a7e6f', textDecoration: 'none',
              borderLeft: active ? '2px solid #b87333' : '2px solid transparent',
              paddingLeft: 10, marginLeft: -12,
              fontWeight: active ? 500 : 400,
            }}>{t}</a>
          ))}
        </nav>
      </div>
    </div>
  );
}

const paperCode = {
  fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
  background: '#ede6d7', padding: '1px 6px', borderRadius: 4,
  color: '#b87333',
};
const paperH2 = {
  fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 22,
  margin: '32px 0 10px', color: '#2a2520', letterSpacing: '-0.01em',
};
const paperP = { fontSize: 15, color: '#5a4f43', lineHeight: 1.6, margin: '0 0 14px' };
const paperPre = {
  fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
  background: '#ede6d7', padding: '12px 14px', borderRadius: 8,
  color: '#2a2520', overflow: 'auto', margin: '0 0 22px',
  boxShadow: 'inset 0 0 0 1px rgba(42,37,32,0.05)',
};
const paperLink = { color: '#b87333', textDecoration: 'none', fontWeight: 500 };

function PublishedEndpoint({ method, path, desc, req, res }) {
  const methodBg = method === 'GET'
    ? { bg: '#e3ead6', fg: '#4a7a2a' }
    : { bg: '#f7e5cc', fg: '#b87333' };

  return (
    <div style={{
      margin: '24px 0 28px', borderRadius: 12,
      background: '#fff', boxShadow: '0 1px 0 rgba(42,37,32,0.05), inset 0 0 0 1px rgba(42,37,32,0.08)',
      overflow: 'hidden',
    }}>
      {/* Head */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 16px', background: '#faf8f2',
        borderBottom: '1px solid rgba(42,37,32,0.06)',
      }}>
        <span style={{
          padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700,
          fontFamily: "'JetBrains Mono', monospace",
          background: methodBg.bg, color: methodBg.fg, letterSpacing: '0.04em',
        }}>{method}</span>
        <code style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 14,
          color: '#2a2520',
        }}>{path}</code>
        <div style={{ flex: 1 }}/>
        <button style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '4px 9px', background: '#fff', color: '#5a4f43',
          border: 'none', borderRadius: 5,
          boxShadow: 'inset 0 0 0 1px rgba(42,37,32,0.12)',
          fontSize: 11, fontFamily: 'inherit', cursor: 'pointer',
        }}>
          <I.External size={10}/>Open in Invoker
        </button>
      </div>

      {desc && (
        <div style={{ padding: '12px 16px', fontSize: 13, color: '#5a4f43',
          borderBottom: '1px solid rgba(42,37,32,0.06)' }}>{desc}</div>
      )}

      {/* Request / response split */}
      <div style={{ display: 'grid', gridTemplateColumns: req ? '1fr 1fr' : '1fr' }}>
        {req && (
          <div style={{ padding: '12px 16px', borderRight: '1px solid rgba(42,37,32,0.06)' }}>
            <div style={{ fontSize: 10, color: '#8a7e6f', fontWeight: 600,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              fontFamily: "'JetBrains Mono', monospace", marginBottom: 8 }}>Request</div>
            <pre style={{
              margin: 0, fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12, lineHeight: 1.6, color: '#2a2520', whiteSpace: 'pre',
            }}>{req}</pre>
          </div>
        )}
        <div style={{ padding: '12px 16px' }}>
          <div style={{ fontSize: 10, color: '#8a7e6f', fontWeight: 600,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            fontFamily: "'JetBrains Mono', monospace", marginBottom: 8,
            display: 'flex', alignItems: 'center', gap: 6 }}>
            Response
            <span style={{
              color: '#4a7a2a', background: '#e3ead6',
              padding: '1px 5px', borderRadius: 3, fontWeight: 700,
              textTransform: 'none', letterSpacing: 0,
            }}>200</span>
          </div>
          <pre style={{
            margin: 0, fontFamily: "'JetBrains Mono', monospace",
            fontSize: 12, lineHeight: 1.6, color: '#2a2520', whiteSpace: 'pre',
          }}>{res}</pre>
        </div>
      </div>
    </div>
  );
}
