function Welcome() {
  const cards = [
    { Icon: Send,  label: 'Send Request',        kbd: 'Cmd + Enter',     color: '#e6c188' },
    { Icon: Globe, label: 'Switch Environment',  kbd: 'Cmd + E',         color: '#ffcdb3' },
    { Icon: Code2, label: 'Format JSON',         kbd: 'Cmd + Shift + F', color: '#dbc3a1' },
  ];
  return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: 12, background: 'rgba(230,193,136,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={32} style={{ color: '#e6c188' }}/>
          </div>
        </div>
        <h2 style={{ fontFamily: "'Manrope'", fontSize: 20, fontWeight: 600, color: '#e7e5e4', margin: '0 0 8px' }}>
          Welcome to Invoker
        </h2>
        <p style={{ fontSize: 13, color: '#acabaa', margin: '0 0 4px' }}>
          Select a request from the sidebar to get started.
        </p>
        <p style={{ fontSize: 11, color: '#767575', margin: '0 0 24px' }}>(sample data)</p>

        <div style={{ display: 'grid', gap: 10, textAlign: 'left' }}>
          {cards.map(({ Icon, label, kbd, color }) => (
            <div key={label} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 8,
              background: '#0e0e0e', boxShadow: 'inset 0 0 0 1px rgba(66,71,84,0.25)',
            }}>
              <Icon size={16} style={{ color, flexShrink: 0 }}/>
              <div>
                <div style={{ fontWeight: 500, color: '#e7e5e4', fontSize: 12 }}>{label}</div>
                <div style={{ color: '#767575', fontSize: 11, fontFamily: "'JetBrains Mono'" }}>{kbd}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
Object.assign(window, { Welcome });
