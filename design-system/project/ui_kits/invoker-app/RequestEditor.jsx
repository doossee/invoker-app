// RequestEditor — URL bar, tab bar, body preview, response panel.

const TABS = ['Headers', 'Body', 'Auth', 'Scripts', 'Vars', 'Params'];

const METHOD_TEXT = {
  GET: '#4ae176', POST: '#e6c188', PUT: '#dbc3a1', PATCH: '#ffcdb3', DELETE: '#f97758',
};

function UrlBar({ method, url, onMethod, onUrl, onSend, loading }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 12, boxShadow: 'inset 0 -1px 0 rgba(66,71,84,0.25)' }}>
      <select value={method} onChange={e => onMethod(e.target.value)}
        style={{
          background: '#191a1a', color: METHOD_TEXT[method] || '#e7e5e4',
          fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 500,
          padding: '8px 10px', borderRadius: 8, border: '1px solid #484848',
          minWidth: 88, textAlign: 'center', cursor: 'pointer', appearance: 'none',
        }}>
        {['GET','POST','PUT','PATCH','DELETE'].map(m => <option key={m} value={m}>{m}</option>)}
      </select>
      <input value={url} onChange={e => onUrl(e.target.value)}
        placeholder="Enter URL or paste cURL..."
        onKeyDown={e => e.key === 'Enter' && !loading && onSend()}
        style={{
          flex: 1, background: '#191a1a', color: '#e7e5e4',
          fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
          padding: '8px 12px', borderRadius: 8, border: '1px solid #484848', outline: 'none',
        }} />
      <button onClick={onSend} disabled={loading}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: loading ? 'rgba(230,193,136,0.5)' : '#e6c188', color: '#543c0e',
          fontSize: 12, fontWeight: 500, padding: '8px 16px', borderRadius: 8,
          border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
        }}>
        <Send size={14}/>{loading ? '...' : 'Send'}
      </button>
    </div>
  );
}

function VarToken({ name, set }) {
  const color = set ? '#dbc3a1' : '#f97758';
  return <span style={{ color, fontWeight: 500, background: set ? 'transparent' : 'rgba(249,119,88,0.1)', borderRadius: 2 }}>{`{{${name}}}`}</span>;
}

function BodyPreview({ body }) {
  return (
    <pre style={{
      padding: 16, fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
      color: '#acabaa', lineHeight: 1.7, margin: 0,
    }}>{body}</pre>
  );
}

function ResponsePanel({ result, loading, height }) {
  if (!result && !loading) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#767575', fontSize: 12, boxShadow: 'inset 0 1px 0 rgba(66,71,84,0.25)' }}>
        Click Send to execute the request
      </div>
    );
  }
  if (loading) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#acabaa', fontSize: 12, gap: 8, boxShadow: 'inset 0 1px 0 rgba(66,71,84,0.25)' }}>
        Sending...
      </div>
    );
  }

  return (
    <div style={{ height, display: 'flex', flexDirection: 'column', boxShadow: 'inset 0 1px 0 rgba(66,71,84,0.25)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px',
        background: '#0e0e0e', boxShadow: 'inset 0 -1px 0 rgba(66,71,84,0.25)' }}>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 500,
          padding: '2px 7px', borderRadius: 4,
          background: 'rgba(74,225,118,0.15)', color: '#4ae176',
        }}>200</span>
        <span style={{ fontSize: 12, color: '#acabaa' }}>{result.time}ms</span>
        <span style={{ fontSize: 12, color: '#acabaa' }}>{result.size}</span>
        <span style={{ fontSize: 12, fontWeight: 500, color: '#4ae176' }}>2/2 passed</span>
      </div>
      <pre style={{
        flex: 1, padding: 12, fontFamily: "'JetBrains Mono', monospace",
        fontSize: 12, color: '#e7e5e4', margin: 0, overflow: 'auto', lineHeight: 1.7,
      }}>{result.body}</pre>
    </div>
  );
}

function RequestEditor({ filePath }) {
  const [method, setMethod] = React.useState('POST');
  const [url, setUrl] = React.useState('{{baseUrl}}/auth/login');
  const [tab, setTab] = React.useState('Body');
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState(null);

  React.useEffect(() => {
    // sync state from fake file
    const file = SAMPLE_REQUESTS[filePath];
    if (file) { setMethod(file.method); setUrl(file.url); setResult(null); }
  }, [filePath]);

  const send = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setResult({
        time: 287, size: '1.4 KB',
        body: JSON.stringify({ id: 'u_9f3a21', phone: '+1 415 555 0133', role: 'user', createdAt: '2026-04-18T10:32:14Z' }, null, 2),
      });
    }, 600);
  };

  const file = SAMPLE_REQUESTS[filePath] || SAMPLE_REQUESTS['auth/login.ivk'];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <UrlBar method={method} url={url} onMethod={setMethod} onUrl={setUrl} onSend={send} loading={loading} />

      <div style={{ display: 'flex', padding: '0 12px', boxShadow: 'inset 0 -1px 0 rgba(66,71,84,0.25)' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{
              padding: '8px 12px', fontSize: 12, fontWeight: 500,
              background: 'transparent', border: 'none', cursor: 'pointer',
              position: 'relative', color: tab === t ? '#e6c188' : '#acabaa', fontFamily: 'inherit',
            }}>
            {t}
            {tab === t && <div style={{
              position: 'absolute', bottom: 0, left: 12, right: 12, height: 2,
              borderRadius: 9999, background: '#e6c188',
            }}/>}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        {tab === 'Body' && <BodyPreview body={file.body}/>}
        {tab !== 'Body' && (
          <div style={{ padding: 16, color: '#767575', fontSize: 12 }}>
            {tab} tab — edit {tab.toLowerCase()} here.
          </div>
        )}
      </div>

      <ResponsePanel result={result} loading={loading} height={220}/>
    </div>
  );
}

const SAMPLE_REQUESTS = {
  'health.ivk': { method: 'GET', url: 'https://httpbin.org/get', body: '# Health Check\n# Simple GET to verify the API is running' },
  'auth/login.ivk': { method: 'POST', url: '{{baseUrl}}/auth/login', body: '{\n  "jsonrpc": "2.0",\n  "method": "Auth.login",\n  "params": {\n    "phone": "{{phone}}"\n  }\n}' },
  'auth/get-me.ivk': { method: 'POST', url: '{{baseUrl}}/auth/me', body: '{\n  "jsonrpc": "2.0",\n  "method": "Auth.getMe",\n  "params": {}\n}' },
  'users/list.ivk': { method: 'GET', url: '{{baseUrl}}/users?page=1&size=20', body: '# Paginated user list' },
  'users/create.ivk': { method: 'POST', url: '{{baseUrl}}/users', body: '{\n  "name": "{{userName}}",\n  "email": "{{userEmail}}",\n  "role": "user"\n}' },
  'users/update.ivk': { method: 'PUT', url: '{{baseUrl}}/users/{{userId}}', body: '{\n  "name": "{{userName}}"\n}' },
  'users/delete.ivk': { method: 'DELETE', url: '{{baseUrl}}/users/{{userId}}', body: '' },
};

Object.assign(window, { RequestEditor, UrlBar, ResponsePanel });
