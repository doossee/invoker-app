// Sidebar — rounded island with project header, new-request button, tree, env pill footer.

function Sidebar({ activeFile, activeDoc, setActive, onOpenSettings }) {
  return (
    <div style={sbStyles.root}>
      {/* Project header */}
      <div style={sbStyles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <Zap size={14} style={{ color: '#e6c188', flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#e6c188' }}>My Collection</span>
        </div>
        <button style={sbStyles.iconBtn} title="Add item"><Plus size={14} /></button>
      </div>
      <div style={{ fontSize: 11, color: '#767575', marginLeft: 22, marginTop: 2, padding: '0 12px 8px' }}>
        API Documentation
      </div>

      <div style={{ margin: '0 12px', height: 1, boxShadow: 'inset 0 -1px 0 rgba(66,71,84,0.25)' }} />

      {/* New request */}
      <div style={{ padding: '8px 12px' }}>
        <button style={sbStyles.newReq}>
          <Plus size={14} /> <span>New Request</span>
        </button>
      </div>

      {/* Tree */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <UnifiedTree activeFile={activeFile} activeDoc={activeDoc} setActive={setActive} />
      </div>

      {/* Footer: env + settings */}
      <div style={sbStyles.footer}>
        <EnvPill />
        <button style={sbStyles.iconBtn} onClick={onOpenSettings} title="Settings"><Settings size={14} /></button>
      </div>
    </div>
  );
}

function EnvPill() {
  const [env, setEnv] = React.useState({ name: 'development', color: '#22c55e' });
  const [open, setOpen] = React.useState(false);
  const envs = [
    { name: 'development', color: '#22c55e' },
    { name: 'staging',     color: '#e0af68' },
    { name: 'production',  color: '#f97758' },
  ];
  return (
    <div style={{ position: 'relative' }}>
      <button style={sbStyles.envBtn} onClick={() => setOpen(v => !v)}>
        <span style={{ width: 8, height: 8, borderRadius: 9999, background: env.color }} />
        <span style={{ color: '#acabaa' }}>{env.name}</span>
        <ChevronDown size={12} style={{ color: '#767575', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }} />
      </button>
      {open && (
        <div style={sbStyles.envMenu}>
          {envs.map(e => (
            <button key={e.name} style={sbStyles.envMenuItem}
                    onClick={() => { setEnv(e); setOpen(false); }}>
              <span style={{ width: 8, height: 8, borderRadius: 9999, background: e.color }} />
              <span style={{ flex: 1, color: '#e7e5e4', textAlign: 'left' }}>{e.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const sbStyles = {
  root: {
    background: '#131313', borderRadius: 16,
    boxShadow: 'inset 0 0 0 1px rgba(66,71,84,0.3)',
    height: 'calc(100vh - 24px)', display: 'flex', flexDirection: 'column', overflow: 'hidden',
  },
  header: { padding: '12px 12px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  iconBtn: { background: 'transparent', border: 'none', color: '#767575', padding: 4, borderRadius: 4, cursor: 'pointer', display: 'flex' },
  newReq: {
    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    background: '#191a1a', color: '#e7e5e4', border: 'none',
    boxShadow: 'inset 0 0 0 1px rgba(66,71,84,0.25)', borderRadius: 8,
    padding: '6px 12px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
  },
  footer: {
    marginTop: 'auto', padding: '8px 12px',
    boxShadow: 'inset 0 1px 0 rgba(66,71,84,0.25)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  envBtn: {
    display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px',
    background: 'transparent', border: 'none', borderRadius: 6, cursor: 'pointer',
    fontSize: 12, fontFamily: 'inherit',
  },
  envMenu: {
    position: 'absolute', bottom: '100%', left: 0, marginBottom: 4,
    width: 180, background: '#0e0e0e', border: '1px solid #484848',
    borderRadius: 8, padding: 4, boxShadow: '0 10px 25px rgba(0,0,0,0.5)', zIndex: 50,
  },
  envMenuItem: {
    display: 'flex', alignItems: 'center', gap: 8, width: '100%',
    padding: '6px 10px', fontSize: 12, background: 'transparent', border: 'none', cursor: 'pointer',
    borderRadius: 4, fontFamily: 'inherit',
  },
};

Object.assign(window, { Sidebar });
