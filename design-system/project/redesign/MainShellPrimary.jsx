// Main app shell — primary redesign.
//
// This is THE product UI. Everything (request editing, response viewing,
// folder README rendering, running inline .ivk blocks in a README) lives
// in this shell. The folder README is a TAB TYPE — same shell, same sidebar.
//
// Changes this revision:
// - Tab kind: .ivk (request editor) vs folder (renders README inline)
// - Response tabs are now DIFFERENT from request tabs (Body/Headers/Cookies/Tests/Timeline/Console)
// - Response Body has view-mode toggle: Pretty | Raw | Table (JSON array → table)
// - Split orientation toggle is more prominent (icon changes to reflect state)
// - Inline .ivk blocks inside a rendered README have [Run] + [Open] buttons

const { TOKENS: T, I, InvokerMark, MethodBadge, Kbd } = window;

function MainShellPrimary() {
  const [activeTab, setActiveTab] = React.useState(0);
  const [split, setSplit] = React.useState('horizontal'); // 'horizontal' | 'vertical'
  const [editorTab, setEditorTab] = React.useState('Body');
  const [bodyType, setBodyType] = React.useState('json');
  const [respTab, setRespTab] = React.useState('Body');
  const [respView, setRespView] = React.useState('pretty'); // pretty | raw | table

  // Tab kinds: 'ivk' (request), 'folder' (README rendering)
  const tabs = [
    { kind: 'ivk',    path: 'auth/login.ivk', name: 'login',  method: 'POST', dirty: true },
    { kind: 'folder', path: 'auth',           name: 'auth',   hasReadme: true },
    { kind: 'ivk',    path: 'users/list.ivk', name: 'list',   method: 'GET',  dirty: false },
  ];
  const active = tabs[activeTab];

  return (
    <div style={{ height: '100%', display: 'flex', gap: 12, padding: 12,
      background: T.s1, color: T.fg1, fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ============ SIDEBAR ============ */}
      <ShellSidebar activePath={active?.path}/>

      {/* ============ MAIN ============ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, gap: 10 }}>

        {/* Editor tabs row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, height: 34 }}>
          <div style={{ display: 'flex', gap: 2, flex: 1, minWidth: 0, overflow: 'hidden' }}>
            {tabs.map((t, i) => (
              <EditorTab key={t.path} tab={t} active={i === activeTab}
                         onSelect={() => setActiveTab(i)}/>
            ))}
            <button style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 28, height: 28, background: 'transparent', border: 'none',
              borderRadius: 6, color: T.fg3, cursor: 'pointer', marginLeft: 2,
            }} title="New tab">
              <I.Plus size={14}/>
            </button>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {active?.kind === 'ivk' && (
              <SplitToggle value={split} onChange={setSplit}/>
            )}
            <IconBtn tip="Command palette (⌘K)"><I.Search size={14}/></IconBtn>
            <IconBtn tip="History"><I.Clock size={14}/></IconBtn>
          </div>
        </div>

        {active?.kind === 'ivk'    && <IvkTabBody active={active} split={split}
          editorTab={editorTab} setEditorTab={setEditorTab}
          bodyType={bodyType} setBodyType={setBodyType}
          respTab={respTab} setRespTab={setRespTab}
          respView={respView} setRespView={setRespView}/>}
        {active?.kind === 'folder' && <FolderTabBody active={active} onOpenRequest={(p) => {
          // In the real app this would add the .ivk as a new tab.
          const i = tabs.findIndex(t => t.path === p);
          if (i >= 0) setActiveTab(i);
        }}/>}
      </div>
    </div>
  );
}

// =========================================================================
// SPLIT TOGGLE
// =========================================================================
function SplitToggle({ value, onChange }) {
  return (
    <div style={{
      display: 'flex', gap: 0, background: T.s3, borderRadius: 6,
      boxShadow: `inset 0 0 0 1px ${T.strokeSoft}`, overflow: 'hidden',
    }}>
      <button onClick={() => onChange('horizontal')} title="Side by side"
        style={splitBtn(value === 'horizontal')}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="1" y="2" width="5" height="10" rx="1" stroke="currentColor" strokeWidth="1.2"/>
          <rect x="8" y="2" width="5" height="10" rx="1" stroke="currentColor" strokeWidth="1.2"/>
        </svg>
      </button>
      <button onClick={() => onChange('vertical')} title="Stacked"
        style={splitBtn(value === 'vertical')}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="2" y="1" width="10" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
          <rect x="2" y="8" width="10" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
        </svg>
      </button>
    </div>
  );
}
function splitBtn(active) {
  return {
    width: 28, height: 28, border: 'none', background: active ? T.s5 : 'transparent',
    color: active ? T.amber : T.fg3, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  };
}

// =========================================================================
// .ivk TAB BODY — request editor + response
// =========================================================================
function IvkTabBody({ active, split, editorTab, setEditorTab, bodyType, setBodyType,
                     respTab, setRespTab, respView, setRespView }) {
  return (
    <>
      {/* Breadcrumb + URL bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Breadcrumb parts={['my-collection', ...active.path.split('/')]}/>
        <UrlCapsule method={active.method} url={`{{baseUrl}}/${active.path.replace('.ivk','')}`}/>
      </div>

      {/* Editor + Response split */}
      <div style={{
        flex: 1, display: 'flex', minHeight: 0,
        flexDirection: split === 'horizontal' ? 'row' : 'column', gap: 10,
      }}>
        <Panel style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, minWidth: 0 }}>
          <TabBar tabs={['Body','Params','Headers','Auth','Scripts','Vars']}
                  active={editorTab} onChange={setEditorTab} right={
                    <div style={{ display: 'flex', gap: 6, paddingRight: 8 }}>
                      <BodyTypePill value={bodyType} onChange={setBodyType}/>
                    </div>
                  }/>
          <BodyEditor/>
        </Panel>

        <Panel style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, minWidth: 0 }}>
          <TabBar tabs={['Body','Headers','Cookies','Tests','Timeline','Console']}
                  active={respTab} onChange={setRespTab}
                  right={<ResponseMeta/>}/>
          {/* Body view toggle (Pretty / Raw / Table) — only on Body tab */}
          {respTab === 'Body' && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
              borderBottom: `1px solid ${T.strokeSoft}`, background: 'transparent',
            }}>
              <ViewModePill value={respView} onChange={setRespView}/>
              <span style={{ flex: 1 }}/>
              <span style={{ fontSize: 10, color: T.fg3, fontFamily: "'JetBrains Mono', monospace" }}>
                application/json
              </span>
              <IconBtn tip="Copy"><I.Copy size={12}/></IconBtn>
              <IconBtn tip="Search"><I.Search size={12}/></IconBtn>
            </div>
          )}
          {respTab === 'Body' && respView === 'table' && <ResponseTable/>}
          {respTab === 'Body' && respView !== 'table' && <ResponseBody raw={respView === 'raw'}/>}
          {respTab === 'Headers'  && <ResponseHeaders/>}
          {respTab === 'Cookies'  && <ResponseCookies/>}
          {respTab === 'Tests'    && <ResponseTests/>}
          {respTab === 'Timeline' && <ResponseTimeline/>}
          {respTab === 'Console'  && <ResponseConsole/>}
        </Panel>
      </div>
    </>
  );
}

function ViewModePill({ value, onChange }) {
  const modes = [
    { id: 'pretty', label: 'Pretty' },
    { id: 'raw',    label: 'Raw' },
    { id: 'table',  label: 'Table' },
  ];
  return (
    <div style={{ display: 'flex', gap: 2, background: T.s3, borderRadius: 6,
      boxShadow: `inset 0 0 0 1px ${T.strokeSoft}`, padding: 2 }}>
      {modes.map(m => (
        <button key={m.id} onClick={() => onChange(m.id)} style={{
          padding: '3px 10px', border: 'none', borderRadius: 4,
          background: value === m.id ? T.s5 : 'transparent',
          color: value === m.id ? T.amber : T.fg3, cursor: 'pointer',
          fontFamily: 'inherit', fontSize: 11, fontWeight: 500,
        }}>{m.label}</button>
      ))}
    </div>
  );
}

// =========================================================================
// folder TAB BODY — README rendering inside the shell
// =========================================================================
function FolderTabBody({ active, onOpenRequest }) {
  return (
    <Panel style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, minWidth: 0 }}>
      {/* Tab-inside-tab: README is default; user can browse "Files" as a fallback list view */}
      <TabBar tabs={['README.md','Files']} active="README.md" onChange={() => {}}
              right={
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingRight: 10 }}>
                  <span style={{
                    fontSize: 9, color: T.fg3, fontFamily: "'JetBrains Mono', monospace",
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                  }}>Folder docs</span>
                  <IconBtn tip="Edit README"><I.Edit size={12}/></IconBtn>
                  <IconBtn tip="Reveal in finder"><I.FolderOpen size={12}/></IconBtn>
                </div>
              }/>
      <div style={{ flex: 1, overflow: 'auto', padding: '28px 40px 60px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
            color: T.fg3, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <I.Folder size={11} style={{ color: T.yellow }}/>
            <span>my-collection</span>
            <span style={{ color: T.fg4 }}>/</span>
            <span>{active.path}</span>
            <span style={{ color: T.fg4 }}>/</span>
            <span style={{ color: T.fg2, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <I.Book size={10}/>README.md
            </span>
          </div>
          <h1 style={{
            fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 32,
            letterSpacing: '-0.02em', color: T.fg1, margin: '0 0 8px', lineHeight: 1.1,
          }}>Authentication</h1>
          <p style={{ fontSize: 14, color: T.fg2, lineHeight: 1.55, margin: '0 0 24px' }}>
            Login, logout, and identity endpoints. Every <MdInline>.ivk</MdInline> block below
            is runnable inline, and <MdInline>Open</MdInline> pops it into the editor as a full tab.
          </p>

          <MdH2>Log in</MdH2>
          <MdP>Exchanges a phone + code for a bearer token. Test script saves <MdInline>authToken</MdInline> to the env.</MdP>
          <InlineIvk method="POST" url="{{baseUrl}}/auth/login"
                     body={`{\n  "phone": "{{phone}}",\n  "code":  "{{code}}"\n}`}
                     onOpen={() => onOpenRequest('auth/login.ivk')}/>

          <MdH2>Who am I</MdH2>
          <MdP>Verifies the current token. Returns 401 if missing or expired.</MdP>
          <InlineIvk method="GET" url="{{baseUrl}}/auth/me"
                     body={null}
                     onOpen={() => onOpenRequest('auth/get-me.ivk')}/>

          <MdH2>Log out</MdH2>
          <MdP>Revokes the bearer token server-side and clears <MdInline>authToken</MdInline> locally.</MdP>
          <InlineIvk method="POST" url="{{baseUrl}}/auth/logout"
                     body={null}
                     onOpen={() => onOpenRequest('auth/logout.ivk')}/>
        </div>
      </div>
    </Panel>
  );
}

function MdH2({ children }) {
  return (
    <h2 style={{
      fontFamily: 'Manrope, sans-serif', fontWeight: 600, fontSize: 19,
      color: T.fg1, margin: '32px 0 8px', letterSpacing: '-0.01em',
    }}>{children}</h2>
  );
}
function MdP({ children }) {
  return (
    <p style={{ fontSize: 14, color: T.fg2, lineHeight: 1.55, margin: '0 0 14px' }}>{children}</p>
  );
}
function MdInline({ children }) {
  return (
    <code style={{
      fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5,
      background: T.s3, padding: '1px 6px', borderRadius: 4, color: T.amber,
      boxShadow: `inset 0 0 0 1px ${T.strokeSoft}`,
    }}>{children}</code>
  );
}

function InlineIvk({ method, url, body, onOpen }) {
  const [tab, setTab] = React.useState('Request');
  const hasResponse = tab === 'Response';
  return (
    <div style={{
      marginBottom: 18, borderRadius: 10, overflow: 'hidden',
      background: T.s2, boxShadow: `inset 0 0 0 1px ${T.strokeSoft}`,
    }}>
      {/* Head: method + url + Run + Open */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
        borderBottom: `1px solid ${T.strokeSoft}`,
      }}>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700,
          color: method === 'GET' ? T.green : T.amber, letterSpacing: '0.05em',
          minWidth: 34,
        }}>{method}</span>
        <div style={{ flex: 1, fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
          color: T.fg1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
          <UrlWithVars text={url}/>
        </div>
        <button onClick={onOpen} title="Open as full tab" style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '4px 9px', background: 'transparent', color: T.fg2,
          border: 'none', borderRadius: 5, cursor: 'pointer',
          fontFamily: 'inherit', fontSize: 11, fontWeight: 500,
          boxShadow: `inset 0 0 0 1px ${T.strokeSoft}`,
        }}>
          <I.ExternalLink size={10}/> Open
        </button>
        <button style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '4px 10px', background: T.amber, color: '#3a2807',
          border: 'none', borderRadius: 5, cursor: 'pointer',
          fontFamily: 'inherit', fontSize: 11, fontWeight: 600,
        }}>
          <I.Play size={9}/> Run
        </button>
      </div>

      {/* Request/Response tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2,
        padding: '4px 8px', borderBottom: `1px solid ${T.strokeSoft}`, background: T.s2 }}>
        {['Request','Response'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '4px 10px', borderRadius: 4, border: 'none',
            background: tab === t ? T.s4 : 'transparent',
            color: tab === t ? T.fg1 : T.fg3, cursor: 'pointer',
            fontFamily: 'inherit', fontSize: 11,
          }}>{t}</button>
        ))}
      </div>

      {/* Body */}
      {!hasResponse && body && (
        <pre style={{
          margin: 0, padding: '12px 14px', fontSize: 12.5,
          fontFamily: "'JetBrains Mono', monospace", color: T.fg1, lineHeight: 1.6,
          background: 'transparent',
        }}>{body.split(/(\{\{[^}]+\}\})/g).map((p, i) =>
          p.startsWith('{{') ? (
            <span key={i} style={{ color: T.amber, background: 'rgba(230,193,136,0.08)',
              padding: '0 2px', borderRadius: 2 }}>{p}</span>
          ) : <span key={i}>{p}</span>
        )}</pre>
      )}
      {!hasResponse && !body && (
        <div style={{ padding: '12px 14px', fontSize: 12, color: T.fg3, fontStyle: 'italic' }}>
          No body
        </div>
      )}
      {hasResponse && (
        <div style={{ padding: '12px 14px', fontSize: 12, color: T.fg3, fontStyle: 'italic' }}>
          Press Run to see the response.
        </div>
      )}
    </div>
  );
}

// ============ SIDEBAR ============
function ShellSidebar({ activePath }) {
  return (
    <div style={{
      width: 260, background: T.s2, borderRadius: 14,
      boxShadow: `inset 0 0 0 1px ${T.stroke}`,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      <div style={{ padding: '10px 10px 6px' }}>
        <CollectionSwitcher/>
      </div>
      <div style={{ padding: '0 10px 8px' }}>
        <SidebarSearch/>
      </div>
      <div style={{ margin: '0 10px', height: 1, background: T.strokeSoft }}/>
      <div style={{ padding: '8px 10px' }}>
        <NewItemSplit/>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 4px' }}>
        <Tree activePath={activePath}/>
      </div>
      <div style={{
        padding: '8px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: `inset 0 1px 0 ${T.strokeSoft}`,
      }}>
        <EnvPill/>
        <IconBtn tip="Settings"><I.Settings size={14}/></IconBtn>
      </div>
    </div>
  );
}

function CollectionSwitcher() {
  return (
    <button style={{
      display: 'flex', alignItems: 'center', gap: 8, width: '100%',
      padding: '6px 8px', background: 'transparent', border: 'none',
      borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
    }}>
      <InvokerMark size={14}/>
      <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.amber, lineHeight: 1.2 }}>my-collection</div>
        <div style={{ fontSize: 10, color: T.fg3, marginTop: 1 }}>9 requests · 3 folders</div>
      </div>
      <I.ChevsUpDown size={11} style={{ color: T.fg3 }}/>
    </button>
  );
}

function SidebarSearch() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px',
      background: T.s3, borderRadius: 7,
      boxShadow: `inset 0 0 0 1px ${T.strokeSoft}`,
    }}>
      <I.Search size={11} style={{ color: T.fg3 }}/>
      <input placeholder="Search requests…" style={{
        flex: 1, background: 'transparent', border: 'none', outline: 'none',
        color: T.fg1, fontFamily: 'inherit', fontSize: 12,
      }}/>
      <Kbd>⌘K</Kbd>
    </div>
  );
}

function NewItemSplit() {
  return (
    <div style={{
      display: 'flex', width: '100%', borderRadius: 8, overflow: 'hidden',
      boxShadow: `inset 0 0 0 1px ${T.strokeSoft}`, background: T.s3,
    }}>
      <button style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        background: 'transparent', color: T.fg1, border: 'none',
        padding: '6px 12px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
      }}>
        <I.Plus size={12}/><span>New Request</span>
      </button>
      <div style={{ width: 1, background: T.strokeSoft }}/>
      <button style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'transparent', color: T.fg2, border: 'none',
        padding: '0 8px', cursor: 'pointer',
      }}>
        <I.ChevDown size={11}/>
      </button>
    </div>
  );
}

const TREE_DATA = [
  { type: 'doc',    name: 'Getting Started', path: 'getting-started.md' },
  { type: 'folder', path: 'auth', name: 'auth', hasReadme: true, children: [
    { type: 'ivk', name: 'login',  path: 'auth/login.ivk',  method: 'POST' },
    { type: 'ivk', name: 'get-me', path: 'auth/get-me.ivk', method: 'GET' },
    { type: 'ivk', name: 'logout', path: 'auth/logout.ivk', method: 'POST' },
  ]},
  { type: 'folder', path: 'users', name: 'users', hasReadme: true, children: [
    { type: 'ivk', name: 'list',   path: 'users/list.ivk',   method: 'GET' },
    { type: 'ivk', name: 'create', path: 'users/create.ivk', method: 'POST' },
    { type: 'ivk', name: 'update', path: 'users/update.ivk', method: 'PUT' },
    { type: 'ivk', name: 'delete', path: 'users/delete.ivk', method: 'DELETE' },
  ]},
  { type: 'ivk', name: 'health', path: 'health.ivk', method: 'GET' },
];

function Tree({ activePath }) {
  return (
    <div style={{ padding: '4px 0' }}>
      {TREE_DATA.map((n, i) => <TreeNode key={i} node={n} depth={0} activePath={activePath}/>)}
    </div>
  );
}
function TreeNode({ node, depth, activePath }) {
  const [open, setOpen] = React.useState(true);
  const pad = 10 + depth * 14;
  if (node.type === 'folder') {
    const active = activePath === node.path;
    return (
      <>
        <button style={{ ...rowStyle(pad, active), position: 'relative' }} onClick={() => setOpen(v => !v)}>
          {active && <span style={{
            position: 'absolute', left: 0, top: 4, bottom: 4, width: 2, borderRadius: 2, background: T.amber,
          }}/>}
          {open ? <I.ChevDown size={10} style={{ color: T.fg3 }}/> : <I.ChevRight size={10} style={{ color: T.fg3 }}/>}
          {open ? <I.FolderOpen size={12} style={{ color: T.yellow }}/> : <I.Folder size={12} style={{ color: T.yellow }}/>}
          <span style={{ flex: 1, textAlign: 'left', fontWeight: 500 }}>{node.name}</span>
          {node.hasReadme && <I.Book size={10} style={{ color: active ? T.amber : 'rgba(118,117,117,0.55)' }}/>}
          <span style={{ fontSize: 10, color: 'rgba(118,117,117,0.5)' }}>{node.children.length}</span>
        </button>
        {open && node.children.map((c, i) => <TreeNode key={i} node={c} depth={depth + 1} activePath={activePath}/>)}
      </>
    );
  }
  const active = activePath === node.path;
  return (
    <button style={{ ...rowStyle(pad + 16, active), position: 'relative' }}>
      {active && <span style={{
        position: 'absolute', left: 0, top: 4, bottom: 4, width: 2, borderRadius: 2, background: T.amber,
      }}/>}
      {node.type === 'ivk'
        ? <MethodBadge method={node.method} compact/>
        : <I.File size={11} style={{ color: 'rgba(96,165,250,0.75)' }}/>}
      <span style={{ flex: 1, textAlign: 'left' }}>{node.name}</span>
    </button>
  );
}
function rowStyle(pad, active) {
  return {
    width: '100%', display: 'flex', alignItems: 'center', gap: 6,
    padding: `5px ${pad}px 5px ${pad}px`,
    paddingLeft: pad, paddingRight: 10,
    background: active ? T.s5 : 'transparent',
    color: active ? T.amber : T.fg2,
    fontSize: 12, border: 'none', cursor: 'pointer',
    fontFamily: 'inherit', borderRadius: 0, transition: 'background .12s, color .12s',
  };
}

function EnvPill() {
  return (
    <button style={{
      display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px',
      background: 'transparent', border: 'none', borderRadius: 6, cursor: 'pointer',
      fontFamily: 'inherit',
    }}>
      <span style={{ width: 7, height: 7, borderRadius: 9999, background: T.green }}/>
      <span style={{ fontSize: 11, color: T.fg2 }}>development</span>
      <I.ChevDown size={10} style={{ color: T.fg3 }}/>
    </button>
  );
}

// ============ EDITOR TABS ============
function EditorTab({ tab, active, onSelect }) {
  return (
    <div onClick={onSelect} style={{
      display: 'flex', alignItems: 'center', gap: 7,
      padding: '0 10px 0 10px', height: 28,
      background: active ? T.s3 : 'transparent',
      color: active ? T.fg1 : T.fg2,
      borderRadius: 6, cursor: 'pointer', maxWidth: 180,
      boxShadow: active ? `inset 0 0 0 1px ${T.stroke}` : 'none',
    }}>
      {tab.kind === 'folder'
        ? <I.Book size={11} style={{ color: active ? T.amber : T.fg3, flexShrink: 0 }}/>
        : <MethodBadge method={tab.method} compact/>}
      <span style={{ fontSize: 12, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {tab.name}
      </span>
      {tab.dirty && <span style={{ width: 5, height: 5, borderRadius: 9999, background: T.amber, flexShrink: 0 }}/>}
      <button onClick={(e) => e.stopPropagation()} style={{
        width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'transparent', border: 'none', borderRadius: 3, color: T.fg3, cursor: 'pointer',
        opacity: active ? 1 : 0.5,
      }}><I.X size={10}/></button>
    </div>
  );
}

// ============ BREADCRUMB ============
function Breadcrumb({ parts }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11,
      color: T.fg3, fontFamily: "'JetBrains Mono', monospace" }}>
      {parts.map((p, i) => (
        <React.Fragment key={i}>
          <span style={{ color: i === parts.length - 1 ? T.fg1 : T.fg3 }}>{p}</span>
          {i < parts.length - 1 && <I.ChevRight size={10} style={{ color: T.fg4 }}/>}
        </React.Fragment>
      ))}
    </div>
  );
}

// ============ URL CAPSULE ============
function UrlCapsule({ method, url }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'stretch', height: 38,
      background: T.s3, borderRadius: 10,
      boxShadow: `inset 0 0 0 1px ${T.stroke}`,
      overflow: 'hidden',
    }}>
      <button style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '0 12px',
        background: 'transparent', border: 'none', cursor: 'pointer',
        fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 600,
        color: method === 'GET' ? T.green : '#e6c188',
        borderRight: `1px solid ${T.strokeSoft}`, minWidth: 84,
      }}>
        <span>{method}</span>
        <I.ChevDown size={10} style={{ color: T.fg3 }}/>
      </button>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 12px',
        fontFamily: "'JetBrains Mono', monospace", fontSize: 13, minWidth: 0 }}>
        <UrlWithVars text={url}/>
      </div>
      <button style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '0 18px',
        background: T.amber, color: '#3a2807', border: 'none', cursor: 'pointer',
        fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
      }}>
        <I.Send size={13}/><span>Send</span>
      </button>
    </div>
  );
}

function UrlWithVars({ text }) {
  const parts = text.split(/(\{\{[^}]+\}\})/g);
  return (
    <span style={{ color: T.fg1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
      {parts.map((p, i) => {
        if (p.startsWith('{{')) {
          return <span key={i} style={{ color: T.amber, background: 'rgba(230,193,136,0.08)',
            padding: '1px 3px', borderRadius: 3 }}>{p}</span>;
        }
        return <span key={i}>{p}</span>;
      })}
    </span>
  );
}

// ============ TAB BAR ============
function TabBar({ tabs, active, onChange, right }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      boxShadow: `inset 0 -1px 0 ${T.strokeSoft}`,
      height: 34, flexShrink: 0,
    }}>
      <div style={{ display: 'flex', flex: 1, paddingLeft: 8 }}>
        {tabs.map(t => (
          <button key={t} onClick={() => onChange(t)} style={{
            padding: '0 12px', height: 34, background: 'transparent', border: 'none',
            cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 500,
            color: active === t ? T.amber : T.fg2, position: 'relative',
          }}>
            {t}
            {active === t && <span style={{
              position: 'absolute', left: 10, right: 10, bottom: -1, height: 2,
              background: T.amber, borderRadius: 2,
            }}/>}
          </button>
        ))}
      </div>
      {right}
    </div>
  );
}

function BodyTypePill({ value, onChange }) {
  const types = ['json','raw','form-data','binary','graphql'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10,
      fontFamily: "'JetBrains Mono', monospace" }}>
      {types.map(t => (
        <button key={t} onClick={() => onChange(t)} style={{
          padding: '3px 7px', borderRadius: 4,
          background: value === t ? T.s5 : 'transparent',
          color: value === t ? T.amber : T.fg3,
          border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          fontSize: 10, fontWeight: 500,
        }}>{t}</button>
      ))}
    </div>
  );
}

// ============ BODY EDITOR ============
function BodyEditor() {
  const lines = [
    '{',
    '  "jsonrpc": "2.0",',
    '  "method": "Auth.login",',
    '  "params": {',
    '    "phone": "{{phone}}",',
    '    "code":  "{{code}}"',
    '  },',
    '  "id": 1',
    '}',
  ];
  return (
    <div style={{ flex: 1, display: 'flex', fontFamily: "'JetBrains Mono', monospace",
      fontSize: 13, overflow: 'auto', padding: '12px 0' }}>
      <div style={{ padding: '0 12px', color: T.fg4, textAlign: 'right', userSelect: 'none', minWidth: 36 }}>
        {lines.map((_, i) => <div key={i} style={{ lineHeight: 1.6 }}>{i + 1}</div>)}
      </div>
      <div style={{ flex: 1 }}>
        {lines.map((l, i) => <BodyLine key={i} line={l}/>)}
      </div>
    </div>
  );
}

function BodyLine({ line }) {
  const processed = [];
  const varRe = /(\{\{[^}]+\}\})/g;
  let last = 0, m;
  while ((m = varRe.exec(line)) !== null) {
    if (m.index > last) processed.push({ t: 'code', v: line.slice(last, m.index) });
    processed.push({ t: 'var', v: m[0] });
    last = m.index + m[0].length;
  }
  if (last < line.length) processed.push({ t: 'code', v: line.slice(last) });

  return (
    <div style={{ lineHeight: 1.6, paddingRight: 16 }}>
      {processed.map((p, k) => {
        if (p.t === 'var') {
          return <span key={k} style={{ color: T.amber, background: 'rgba(230,193,136,0.08)',
            padding: '0 2px', borderRadius: 2 }}>{p.v}</span>;
        }
        return <CodeSpan key={k} text={p.v}/>;
      })}
    </div>
  );
}
function CodeSpan({ text }) {
  const out = [];
  const re = /"[^"]*"|\b(true|false|null)\b|\b\d+\b|[{}[\],:]/g;
  let last = 0, m, i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(<span key={i++}>{text.slice(last, m.index)}</span>);
    const v = m[0];
    let color = T.fg1;
    if (v.startsWith('"')) color = '#a3d6a7';
    else if (/^\d+$/.test(v)) color = '#60a5fa';
    else if (v === 'true' || v === 'false' || v === 'null') color = T.amberDim;
    else if ('{}[]'.includes(v)) color = T.fg2;
    else if (v === ':') color = T.fg2;
    else if (v === ',') color = T.fg3;
    out.push(<span key={i++} style={{ color }}>{v}</span>);
    last = m.index + v.length;
  }
  if (last < text.length) out.push(<span key={i++}>{text.slice(last)}</span>);
  return <>{out}</>;
}

// ============ RESPONSE ============
function ResponseMeta() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingRight: 12,
      fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>
      <span style={{
        color: T.green, background: 'rgba(74,225,118,0.12)',
        padding: '2px 7px', borderRadius: 4, fontWeight: 600,
      }}>200 OK</span>
      <span style={{ color: T.fg3 }}>287 ms</span>
      <span style={{ color: T.fg3 }}>1.4 KB</span>
    </div>
  );
}

function ResponseBody({ raw }) {
  const pretty = [
    '{',
    '  "result": {',
    '    "id":        "u_9f3a21",',
    '    "phone":     "+1 415 555 0133",',
    '    "role":      "user",',
    '    "createdAt": "2026-04-18T10:32:14Z"',
    '  },',
    '  "jsonrpc": "2.0",',
    '  "id": 1',
    '}',
  ];
  const rawStr = '{"result":{"id":"u_9f3a21","phone":"+1 415 555 0133","role":"user","createdAt":"2026-04-18T10:32:14Z"},"jsonrpc":"2.0","id":1}';
  const lines = raw ? [rawStr] : pretty;
  return (
    <div style={{ flex: 1, display: 'flex', fontFamily: "'JetBrains Mono', monospace",
      fontSize: 13, overflow: 'auto', padding: '12px 0' }}>
      {!raw && <div style={{ padding: '0 12px', color: T.fg4, textAlign: 'right', userSelect: 'none', minWidth: 36 }}>
        {lines.map((_, i) => <div key={i} style={{ lineHeight: 1.6 }}>{i + 1}</div>)}
      </div>}
      <div style={{ flex: 1, paddingLeft: raw ? 14 : 0, paddingRight: 14, wordBreak: raw ? 'break-all' : 'normal',
        whiteSpace: raw ? 'pre-wrap' : 'normal' }}>
        {raw ? <span style={{ color: T.fg1, lineHeight: 1.6 }}>{rawStr}</span>
             : lines.map((l, i) => <BodyLine key={i} line={l}/>)}
      </div>
    </div>
  );
}

function ResponseTable() {
  // Pretend the response was an array of user rows.
  const rows = [
    { id: 'u_9f3a21', phone: '+1 415 555 0133', role: 'user',  createdAt: '2026-04-18T10:32:14Z' },
    { id: 'u_7b2c11', phone: '+1 212 555 0147', role: 'admin', createdAt: '2026-04-16T09:04:00Z' },
    { id: 'u_aa91f0', phone: '+44 20 7946 012', role: 'user',  createdAt: '2026-04-12T15:22:48Z' },
    { id: 'u_3e8f22', phone: '+33 1 70 36 48 0', role: 'user', createdAt: '2026-04-02T08:11:07Z' },
  ];
  const cols = ['id','phone','role','createdAt'];
  return (
    <div style={{ flex: 1, overflow: 'auto' }}>
      <table style={{
        width: '100%', borderCollapse: 'collapse',
        fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
      }}>
        <thead>
          <tr style={{ background: T.s3, color: T.fg3, letterSpacing: '0.04em' }}>
            <th style={thStyle}>#</th>
            {cols.map(c => <th key={c} style={thStyle}>{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id} style={{ borderBottom: `1px solid ${T.strokeSoft}` }}>
              <td style={{ ...tdStyle, color: T.fg4, width: 28 }}>{i}</td>
              {cols.map(c => (
                <td key={c} style={{ ...tdStyle,
                  color: c === 'role' ? (r[c] === 'admin' ? T.amber : T.fg1) : T.fg1,
                }}>
                  {c === 'role' ? (
                    <span style={{
                      padding: '1px 7px', borderRadius: 3, fontSize: 10, fontWeight: 600,
                      background: r[c] === 'admin' ? 'rgba(230,193,136,0.15)' : T.s3,
                      color: r[c] === 'admin' ? T.amber : T.fg2,
                    }}>{r[c]}</span>
                  ) : r[c]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ padding: '8px 14px', fontSize: 10, color: T.fg4,
        fontFamily: "'JetBrains Mono', monospace",
        borderTop: `1px solid ${T.strokeSoft}` }}>
        {rows.length} rows · showing nested shape result[]
      </div>
    </div>
  );
}
const thStyle = {
  textAlign: 'left', padding: '8px 10px', fontSize: 10, fontWeight: 600,
  textTransform: 'uppercase', borderBottom: `1px solid ${T.strokeSoft}`,
};
const tdStyle = {
  padding: '7px 10px', verticalAlign: 'top',
};

function ResponseHeaders() {
  const headers = [
    ['content-type',     'application/json; charset=utf-8'],
    ['content-length',   '1431'],
    ['x-request-id',     'req_9f3a2181b7c0'],
    ['cache-control',    'no-store'],
    ['date',             'Wed, 18 Apr 2026 10:32:14 GMT'],
    ['server',           'cloudflare'],
    ['cf-ray',           '88b2f47a1c09-SJC'],
  ];
  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '4px 0',
      fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
      {headers.map(([k, v], i) => (
        <div key={i} style={{
          display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16,
          padding: '6px 14px',
          borderBottom: i < headers.length - 1 ? `1px solid ${T.strokeSoft}` : 'none',
        }}>
          <span style={{ color: T.fg3 }}>{k}</span>
          <span style={{ color: T.fg1, wordBreak: 'break-all' }}>{v}</span>
        </div>
      ))}
    </div>
  );
}

function ResponseCookies() {
  return (
    <div style={{ flex: 1, padding: 24, color: T.fg3, fontSize: 12, textAlign: 'center',
      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div>
        <I.Cookie size={24} style={{ color: T.fg4, marginBottom: 10 }}/>
        <div style={{ fontSize: 13, color: T.fg2, marginBottom: 4 }}>No cookies set</div>
        <div style={{ fontSize: 11 }}>This response did not set any cookies.</div>
      </div>
    </div>
  );
}

function ResponseTests() {
  const tests = [
    { ok: true,  name: 'status === 200' },
    { ok: true,  name: 'response.result.id exists' },
    { ok: true,  name: 'authToken saved to env' },
    { ok: false, name: 'response.result.role === "admin"', msg: 'expected "admin", got "user"' },
  ];
  const passed = tests.filter(t => t.ok).length;
  return (
    <div style={{ flex: 1, overflow: 'auto' }}>
      <div style={{
        padding: '8px 14px', fontSize: 11, color: T.fg3,
        fontFamily: "'JetBrains Mono', monospace",
        borderBottom: `1px solid ${T.strokeSoft}`,
        display: 'flex', gap: 12,
      }}>
        <span style={{ color: T.green }}>✓ {passed} passed</span>
        <span style={{ color: T.red }}>✗ {tests.length - passed} failed</span>
      </div>
      {tests.map((t, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'flex-start', gap: 10,
          padding: '8px 14px',
          borderBottom: i < tests.length - 1 ? `1px solid ${T.strokeSoft}` : 'none',
          fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
        }}>
          <span style={{
            width: 14, height: 14, borderRadius: 9999, marginTop: 1,
            background: t.ok ? 'rgba(74,225,118,0.15)' : 'rgba(249,119,88,0.15)',
            color: t.ok ? T.green : T.red,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            {t.ok ? <I.Check size={8}/> : <I.X size={8}/>}
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ color: t.ok ? T.fg1 : T.red }}>{t.name}</div>
            {t.msg && <div style={{ color: T.fg3, fontSize: 11, marginTop: 2 }}>{t.msg}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

function ResponseTimeline() {
  const phases = [
    { label: 'DNS lookup',     ms: 12, color: '#60a5fa' },
    { label: 'TCP connect',    ms: 34, color: '#7dd3fc' },
    { label: 'TLS handshake',  ms: 89, color: '#a78bfa' },
    { label: 'Request sent',   ms: 2,  color: T.amber },
    { label: 'Server waiting', ms: 118,color: T.amberDim },
    { label: 'Content download', ms: 32, color: T.green },
  ];
  const total = phases.reduce((a, p) => a + p.ms, 0);
  return (
    <div style={{ flex: 1, padding: '16px 18px', overflow: 'auto',
      fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>
      <div style={{ color: T.fg3, marginBottom: 14 }}>Total {total} ms</div>
      {phases.map((p, i) => (
        <div key={i} style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: T.fg2, marginBottom: 4 }}>
            <span>{p.label}</span>
            <span style={{ color: T.fg3 }}>{p.ms} ms</span>
          </div>
          <div style={{ height: 6, background: T.s3, borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              width: `${(p.ms / total) * 100}%`, height: '100%',
              background: p.color, borderRadius: 3,
            }}/>
          </div>
        </div>
      ))}
    </div>
  );
}

function ResponseConsole() {
  const lines = [
    { l: 'log',   t: '[pre] set vars.phone = "{{phone}}"' },
    { l: 'log',   t: '[request] POST {{baseUrl}}/auth/login' },
    { l: 'log',   t: '[response] 200 OK (287 ms, 1.4 KB)' },
    { l: 'ok',    t: '[test] status === 200 ✓' },
    { l: 'ok',    t: '[test] response.result.id exists ✓' },
    { l: 'warn',  t: '[post] env.authToken is new — saved' },
    { l: 'fail',  t: '[test] response.result.role === "admin" ✗' },
  ];
  const tagColor = (l) => l === 'ok' ? T.green : l === 'warn' ? T.amber : l === 'fail' ? T.red : T.fg3;
  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '10px 14px',
      fontFamily: "'JetBrains Mono', monospace", fontSize: 12, lineHeight: 1.7 }}>
      {lines.map((ln, i) => (
        <div key={i} style={{ color: ln.l === 'fail' ? T.red : T.fg1, display: 'flex', gap: 8 }}>
          <span style={{ color: tagColor(ln.l), width: 42, flexShrink: 0 }}>{ln.l}</span>
          <span>{ln.t}</span>
        </div>
      ))}
    </div>
  );
}

// ============ GENERIC ============
function Panel({ style, children }) {
  return (
    <div style={{
      background: T.s2, borderRadius: 12,
      boxShadow: `inset 0 0 0 1px ${T.stroke}`, overflow: 'hidden',
      ...style,
    }}>{children}</div>
  );
}
function IconBtn({ children, tip, onClick }) {
  return (
    <button onClick={onClick} title={tip} style={{
      width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'transparent', border: 'none', borderRadius: 6,
      color: T.fg2, cursor: 'pointer',
    }}>{children}</button>
  );
}

window.MainShellPrimary = MainShellPrimary;
