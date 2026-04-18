// DocView — renders a canned Markdown page with inline ivk widgets.

function IvkWidget({ method = 'POST', url = '{{baseUrl}}/auth/login', name = 'Login', onOpen }) {
  const [ran, setRan] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const run = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); setRan(true); }, 500);
  };
  return (
    <div style={{
      margin: '16px 0', background: '#131313', borderRadius: 10,
      boxShadow: 'inset 0 0 0 1px rgba(66,71,84,0.25)', overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px' }}>
        <MethodBadge method={method}/>
        <span style={{ flex: 1, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#acabaa' }}>
          <span style={{ color: '#767575' }}>{'{{'}</span>
          <span style={{ color: '#dbc3a1' }}>baseUrl</span>
          <span style={{ color: '#767575' }}>{'}}'}</span>
          {url.replace('{{baseUrl}}', '')}
        </span>
        <span style={{ fontSize: 11, color: '#767575', fontWeight: 500 }}>{name}</span>
        <button onClick={run} disabled={loading}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: '#e6c188', color: '#543c0e', fontSize: 11, fontWeight: 500,
            padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          }}>
          <Play size={12}/>{loading ? '...' : 'Run'}
        </button>
        <button onClick={onOpen}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'transparent', color: '#acabaa', fontSize: 11, fontWeight: 500,
            padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          }}>
          <ExternalLink size={12}/>Open
        </button>
      </div>
      {ran && (
        <div style={{ boxShadow: 'inset 0 1px 0 rgba(66,71,84,0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px' }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 500, padding: '2px 7px', borderRadius: 4, background: 'rgba(74,225,118,0.15)', color: '#4ae176' }}>200</span>
            <span style={{ fontSize: 11, color: '#acabaa' }}>287ms</span>
            <span style={{ fontSize: 11, color: '#acabaa' }}>1.4 KB</span>
            <span style={{ fontSize: 11, fontWeight: 500, color: '#4ae176' }}>2/2 ✓</span>
          </div>
          <pre style={{
            margin: '0 16px 16px', padding: 12, background: '#000',
            fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#acabaa',
            borderRadius: 6, overflow: 'auto',
          }}>{`{\n  "id": "u_9f3a21",\n  "token": "eyJhbGci..."\n}`}</pre>
        </div>
      )}
    </div>
  );
}

function DocView({ docPath, setActive }) {
  return (
    <div style={{ height: '100%', overflow: 'auto' }}>
      <div style={{ maxWidth: 768, margin: '0 auto', padding: '32px 24px', color: '#e7e5e4', lineHeight: 1.75 }}>
        <h1 style={{ fontFamily: "'Manrope'", fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 12px' }}>Getting Started</h1>
        <p style={{ color: '#acabaa', fontSize: 14, margin: '12px 0' }}>
          Welcome to the Invoker App — a Bruno-like API client for the web.
        </p>

        <h2 style={{ fontFamily: "'Manrope'", fontSize: 22, fontWeight: 600, margin: '28px 0 8px', paddingBottom: 6, borderBottom: '1px solid #484848' }}>Health check</h2>
        <p style={{ color: '#acabaa', fontSize: 14 }}>The simplest request — just a GET to verify connectivity:</p>
        <IvkWidget method="GET" url="https://httpbin.org/get" name="Health Check"
                   onOpen={() => setActive({ file: 'health.ivk' })}/>

        <h2 style={{ fontFamily: "'Manrope'", fontSize: 22, fontWeight: 600, margin: '28px 0 8px', paddingBottom: 6, borderBottom: '1px solid #484848' }}>Authentication</h2>
        <h3 style={{ fontFamily: "'Manrope'", fontSize: 18, fontWeight: 600, margin: '20px 0 8px' }}>Step 1: Login</h3>
        <p style={{ color: '#acabaa', fontSize: 14 }}>
          Send credentials to get a token. The post-script saves the token to your environment:
        </p>
        <IvkWidget method="POST" name="Login" onOpen={() => setActive({ file: 'auth/login.ivk' })}/>

        <h3 style={{ fontFamily: "'Manrope'", fontSize: 18, fontWeight: 600, margin: '20px 0 8px' }}>Step 2: Use the token</h3>
        <p style={{ color: '#acabaa', fontSize: 14 }}>
          Now use the saved token — notice the <code style={{ background: '#191a1a', padding: '1px 6px', borderRadius: 4, fontFamily: "'JetBrains Mono'", fontSize: 12, color: '#dbc3a1' }}>@auth bearer {'{{token}}'}</code> directive:
        </p>
        <IvkWidget method="POST" name="Get Me" onOpen={() => setActive({ file: 'auth/get-me.ivk' })}/>
      </div>
    </div>
  );
}

Object.assign(window, { DocView, IvkWidget });
