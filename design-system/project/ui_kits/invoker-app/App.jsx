function App() {
  const [active, setActive] = React.useState({ file: null, doc: null });
  const set = (v) => setActive({ file: v.file || null, doc: v.doc || null });

  return (
    <div data-screen-label="01 Invoker App" style={{
      height: '100vh', display: 'flex', background: '#000', color: '#e7e5e4',
      overflow: 'hidden', fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <div style={{ padding: 12, flexShrink: 0, width: 260 }}>
        <Sidebar activeFile={active.file} activeDoc={active.doc} setActive={set}
                 onOpenSettings={() => {}}/>
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {active.doc ? <DocView docPath={active.doc} setActive={set}/>
         : active.file ? <RequestEditor filePath={active.file}/>
         : <Welcome/>}
      </div>
    </div>
  );
}
Object.assign(window, { App });
