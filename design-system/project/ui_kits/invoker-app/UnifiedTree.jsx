// UnifiedTree — displays .ivk and .md in one tree with method badges, folder counts, active accent.

const METHOD_COLORS = {
  GET:    { c: '#4ae176', bg: 'rgba(74,225,118,0.15)' },
  POST:   { c: '#e6c188', bg: 'rgba(230,193,136,0.15)' },
  PUT:    { c: '#dbc3a1', bg: 'rgba(219,195,161,0.15)' },
  PATCH:  { c: '#ffcdb3', bg: 'rgba(255,205,179,0.15)' },
  DELETE: { c: '#f97758', bg: 'rgba(249,119,88,0.15)' },
};

const SAMPLE = [
  { type: 'doc', path: 'getting-started.md', name: 'Getting Started' },
  { type: 'folder', name: 'auth', hasReadme: true, readme: 'auth/README.md', children: [
    { type: 'ivk', path: 'auth/login.ivk',  name: 'login',  method: 'POST' },
    { type: 'ivk', path: 'auth/get-me.ivk', name: 'get-me', method: 'POST' },
  ]},
  { type: 'folder', name: 'users', children: [
    { type: 'ivk', path: 'users/list.ivk',   name: 'list',   method: 'GET' },
    { type: 'ivk', path: 'users/create.ivk', name: 'create', method: 'POST' },
    { type: 'ivk', path: 'users/update.ivk', name: 'update', method: 'PUT' },
    { type: 'ivk', path: 'users/delete.ivk', name: 'delete', method: 'DELETE' },
    { type: 'doc', path: 'users/api.md',     name: 'Users API' },
  ]},
  { type: 'ivk', path: 'health.ivk', name: 'health', method: 'GET' },
];

function MethodBadge({ method }) {
  const s = METHOD_COLORS[method] || { c: '#767575', bg: 'rgba(118,117,117,0.15)' };
  const label = method === 'DELETE' ? 'DEL' : method;
  return (
    <span style={{
      fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700,
      letterSpacing: '0.08em', padding: '2px 6px', borderRadius: 3,
      color: s.c, background: s.bg, minWidth: 30, textAlign: 'center', flexShrink: 0,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    }}>{label}</span>
  );
}

function countFiles(node) {
  if (node.type !== 'folder') return 1;
  return (node.children || []).reduce((a, c) => a + countFiles(c), 0);
}

function TreeRow({ node, depth, activeFile, activeDoc, setActive, expanded, toggle }) {
  const pad = 12 + depth * 20;

  if (node.type === 'folder') {
    const isOpen = expanded[node.name] ?? true;
    const isActive = node.hasReadme && activeDoc === node.readme;
    return (
      <>
        <button
          style={{
            ...rowStyle, paddingLeft: pad,
            background: isActive ? '#252626' : 'transparent',
            color: isActive ? '#e6c188' : '#acabaa',
          }}
          onClick={() => {
            toggle(node.name);
            if (node.hasReadme) setActive({ doc: node.readme });
          }}
        >
          {isActive && <span style={activeBarStyle} />}
          <span style={{ color: '#767575', display: 'flex' }}>
            {isOpen ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
          </span>
          <span style={{ color: '#facc15', display: 'flex' }}>
            {isOpen ? <FolderOpen size={15}/> : <Folder size={15}/>}
          </span>
          <span style={{ fontWeight: 500, flex: 1, textAlign: 'left' }}>{node.name}</span>
          {node.hasReadme && (
            <span style={{ color: isActive ? '#e6c188' : 'rgba(118,117,117,0.5)', display: 'flex' }}>
              <BookOpen size={11}/>
            </span>
          )}
          <span style={{ fontSize: 10, color: 'rgba(118,117,117,0.6)', fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
            {countFiles(node)}
          </span>
        </button>
        {isOpen && node.children.map(c => (
          <TreeRow key={c.path || c.name} node={c} depth={depth + 1}
                   activeFile={activeFile} activeDoc={activeDoc} setActive={setActive}
                   expanded={expanded} toggle={toggle}/>
        ))}
      </>
    );
  }

  const isIvk = node.type === 'ivk';
  const isActive = isIvk ? activeFile === node.path : activeDoc === node.path;
  return (
    <button
      style={{
        ...rowStyle, paddingLeft: pad + 20,
        background: isActive ? '#252626' : 'transparent',
        color: isActive ? '#e6c188' : '#acabaa',
      }}
      onClick={() => setActive(isIvk ? { file: node.path } : { doc: node.path })}
    >
      {isActive && <span style={activeBarStyle} />}
      {isIvk
        ? <MethodBadge method={node.method}/>
        : <FileText size={14} style={{ color: 'rgba(96,165,250,0.8)', flexShrink: 0 }}/>}
      <span style={{ flex: 1, textAlign: 'left' }}>{node.name}</span>
      {!isIvk && (
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(118,117,117,0.5)' }}>MD</span>
      )}
    </button>
  );
}

const rowStyle = {
  position: 'relative', width: '100%', display: 'flex', alignItems: 'center', gap: 8,
  padding: '8px 12px', fontSize: 13, border: 'none', cursor: 'pointer',
  fontFamily: 'inherit', transition: 'color .15s, background .15s',
};
const activeBarStyle = {
  position: 'absolute', left: 0, top: 2, bottom: 2, width: 2, borderRadius: 9999, background: '#e6c188',
};

function UnifiedTree({ activeFile, activeDoc, setActive }) {
  const [expanded, setExpanded] = React.useState({ auth: true, users: true });
  const toggle = (n) => setExpanded(e => ({ ...e, [n]: !(e[n] ?? true) }));
  return (
    <div style={{ padding: '6px 0' }}>
      {SAMPLE.map(n => (
        <TreeRow key={n.path || n.name} node={n} depth={0}
                 activeFile={activeFile} activeDoc={activeDoc} setActive={setActive}
                 expanded={expanded} toggle={toggle}/>
      ))}
    </div>
  );
}

Object.assign(window, { UnifiedTree, MethodBadge });
