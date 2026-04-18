import { useState, useMemo, useEffect, useRef } from 'react';
import { Search, BookOpen, Zap } from 'lucide-react';
import { parseIvk } from 'ivkjs';
import { useCollectionStore } from '@/stores/collection-store';
import { useDocsStore } from '@/stores/docs-store';
import { useEditorStore, type TabData } from '@/stores/editor-store';
import { TOKENS, Kbd, MethodBadge, METHOD_PALETTE } from '@/components/shared/primitives';

interface Props {
  onClose: () => void;
}

interface PaletteItem {
  type: 'request' | 'action' | 'doc';
  name: string;
  path?: string;
  method?: string;
  icon?: React.ReactNode;
}

export function CommandPalette({ onClose }: Props) {
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const files = useCollectionStore((s) => s.files);
  const docs = useDocsStore((s) => s.docs);
  const openTab = useEditorStore((s) => s.openTab);
  const setSettingsOpen = useEditorStore((s) => s.setSettingsOpen);
  const setEnvSettingsOpen = useEditorStore((s) => s.setEnvSettingsOpen);

  // Build items
  const allItems = useMemo(() => {
    const items: PaletteItem[] = [];

    // Requests
    for (const f of files) {
      let method = 'GET';
      try {
        method = parseIvk(f.content).method;
      } catch { /* ignore */ }
      const name = f.path.split('/').pop()?.replace('.ivk', '') ?? f.path;
      items.push({ type: 'request', name, path: f.path, method });
    }

    // Actions
    items.push({ type: 'action', name: 'Open Settings', icon: <Zap size={14} /> });
    items.push({ type: 'action', name: 'Manage Environments', icon: <Zap size={14} /> });
    items.push({ type: 'action', name: 'New Request', icon: <Zap size={14} /> });

    // Docs
    for (const d of docs) {
      const name = d.path.split('/').pop()?.replace('.md', '') ?? d.path;
      items.push({ type: 'doc', name, path: d.path });
    }

    return items;
  }, [files, docs]);

  // Filter
  const filtered = useMemo(() => {
    if (!query.trim()) return allItems;
    const q = query.toLowerCase();
    return allItems.filter((item) => item.name.toLowerCase().includes(q));
  }, [allItems, query]);

  // Grouped
  const requests = filtered.filter((i) => i.type === 'request');
  const actions = filtered.filter((i) => i.type === 'action');
  const docItems = filtered.filter((i) => i.type === 'doc');
  const flat = [...requests, ...actions, ...docItems];

  useEffect(() => {
    setSelectedIdx(0);
  }, [query]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIdx((prev) => Math.min(prev + 1, flat.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIdx((prev) => Math.max(prev - 1, 0));
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        const item = flat[selectedIdx];
        if (item) selectItem(item);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  function selectItem(item: PaletteItem) {
    if (item.type === 'request' && item.path) {
      const name = item.path.split('/').pop()?.replace('.ivk', '') ?? item.path;
      const tab: TabData = { kind: 'ivk', path: item.path, name, method: item.method };
      openTab(tab);
      useCollectionStore.getState().setActiveFile(item.path);
    } else if (item.type === 'doc' && item.path) {
      const name = item.path.split('/').pop()?.replace('.md', '') ?? item.path;
      const tab: TabData = { kind: 'folder', path: item.path, name, hasReadme: true };
      openTab(tab);
    } else if (item.name === 'Open Settings') {
      setSettingsOpen(true);
    } else if (item.name === 'Manage Environments') {
      setEnvSettingsOpen(true);
    }
    onClose();
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '12%',
        fontFamily: "'Inter', system-ui, sans-serif",
        zIndex: 100,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          zIndex: 1,
          width: 640,
          maxWidth: '92%',
          background: TOKENS.s2,
          borderRadius: 12,
          boxShadow: `0 30px 80px rgba(0,0,0,0.7), inset 0 0 0 1px ${TOKENS.stroke}`,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Search input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '14px 16px',
            borderBottom: `1px solid ${TOKENS.strokeSoft}`,
          }}
        >
          <Search size={14} style={{ color: TOKENS.amber, flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search requests, actions, docs..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: TOKENS.fg1,
              fontSize: 15,
              fontFamily: 'inherit',
            }}
          />
          <Kbd>Esc</Kbd>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 380, overflowY: 'auto', padding: '6px 0' }}>
          {requests.length > 0 && (
            <Section label="REQUESTS">
              {requests.map((item, i) => {
                const globalIdx = flat.indexOf(item);
                return (
                  <PaletteRow
                    key={item.path}
                    item={item}
                    active={globalIdx === selectedIdx}
                    showReturnKbd={globalIdx === 0}
                    onClick={() => selectItem(item)}
                    query={query}
                  />
                );
              })}
            </Section>
          )}
          {actions.length > 0 && (
            <Section label="ACTIONS">
              {actions.map((item) => {
                const globalIdx = flat.indexOf(item);
                return (
                  <PaletteRow
                    key={item.name}
                    item={item}
                    active={globalIdx === selectedIdx}
                    onClick={() => selectItem(item)}
                    query={query}
                  />
                );
              })}
            </Section>
          )}
          {docItems.length > 0 && (
            <Section label="DOCS">
              {docItems.map((item) => {
                const globalIdx = flat.indexOf(item);
                return (
                  <PaletteRow
                    key={item.path}
                    item={item}
                    active={globalIdx === selectedIdx}
                    onClick={() => selectItem(item)}
                    query={query}
                  />
                );
              })}
            </Section>
          )}
          {flat.length === 0 && (
            <div style={{ padding: '16px', textAlign: 'center', color: TOKENS.fg3, fontSize: 13 }}>
              No results found.
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '9px 14px',
            borderTop: `1px solid ${TOKENS.strokeSoft}`,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            fontSize: 11,
            color: TOKENS.fg3,
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>↑↓</span> Navigate
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>↵</span> Open
          </span>
          <div style={{ flex: 1 }} />
          <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{flat.length} results</span>
        </div>
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: '4px 0' }}>
      <div
        style={{
          padding: '6px 16px 4px',
          fontSize: 10,
          fontWeight: 600,
          color: TOKENS.fg4,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

function PaletteRow({
  item,
  active,
  showReturnKbd,
  onClick,
  query,
}: {
  item: PaletteItem;
  active: boolean;
  showReturnKbd?: boolean;
  onClick: () => void;
  query: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 14px',
        margin: '0 4px',
        borderRadius: 6,
        background: active ? 'rgba(230,193,136,0.08)' : 'transparent',
        position: 'relative',
        border: 'none',
        width: 'calc(100% - 8px)',
        cursor: 'pointer',
        fontFamily: 'inherit',
        textAlign: 'left',
      }}
    >
      {active && (
        <span
          style={{
            position: 'absolute',
            left: 0,
            top: 6,
            bottom: 6,
            width: 2,
            background: TOKENS.amber,
            borderRadius: 2,
          }}
        />
      )}

      {/* Icon */}
      {item.type === 'request' && item.method && (
        <MethodBadge method={item.method} compact />
      )}
      {item.type === 'action' && (
        <Zap size={14} style={{ color: TOKENS.amber, flexShrink: 0 }} />
      )}
      {item.type === 'doc' && (
        <BookOpen size={14} style={{ color: TOKENS.fg2, flexShrink: 0 }} />
      )}

      {/* Name with fuzzy highlight */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: TOKENS.fg1 }}>
          <HighlightMatch text={item.name} query={query} />
        </div>
        {item.path && (
          <div style={{ fontSize: 11, color: TOKENS.fg3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.path}
          </div>
        )}
      </div>

      {showReturnKbd && <Kbd>↵</Kbd>}
    </button>
  );
}

function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const q = query.toLowerCase();
  const parts: { char: string; match: boolean }[] = [];
  let qi = 0;
  for (let i = 0; i < text.length; i++) {
    if (qi < q.length && text[i].toLowerCase() === q[qi]) {
      parts.push({ char: text[i], match: true });
      qi++;
    } else {
      parts.push({ char: text[i], match: false });
    }
  }
  return (
    <>
      {parts.map((p, i) => (
        <span key={i} style={p.match ? { color: TOKENS.amber, fontWeight: 600 } : undefined}>
          {p.char}
        </span>
      ))}
    </>
  );
}
