import { Plus, X, BookOpen, Search, Clock } from 'lucide-react';
import { useEditorStore, type TabData } from '@/stores/editor-store';
import { TOKENS, MethodBadge, SplitToggle, IconBtn } from '@/components/shared/primitives';

export function EditorTabs() {
  const tabs = useEditorStore((s) => s.tabs);
  const activeTabPath = useEditorStore((s) => s.activeTabPath);
  const setActiveTab = useEditorStore((s) => s.setActiveTab);
  const closeTab = useEditorStore((s) => s.closeTab);
  const splitDirection = useEditorStore((s) => s.splitDirection);
  const setSplitDirection = useEditorStore((s) => s.setSplitDirection);
  const setCommandPaletteOpen = useEditorStore((s) => s.setCommandPaletteOpen);

  const activeTab = tabs.find((t) => t.path === activeTabPath);
  const showActions = activeTab?.kind === 'ivk';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        height: 34,
      }}
    >
      {/* Tab area */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          overflow: 'hidden',
          display: 'flex',
          gap: 2,
        }}
      >
        {tabs.map((tab) => (
          <EditorTab
            key={tab.path}
            tab={tab}
            active={tab.path === activeTabPath}
            onSelect={() => setActiveTab(tab.path)}
            onClose={() => closeTab(tab.path)}
          />
        ))}
        <button
          title="New tab"
          style={{
            width: 28,
            height: 28,
            background: 'transparent',
            border: 'none',
            borderRadius: 6,
            color: TOKENS.fg3,
            cursor: 'pointer',
            marginLeft: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Actions area */}
      {showActions && (
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          <SplitToggle value={splitDirection} onChange={setSplitDirection} />
          <IconBtn tip="Command palette (⌘K)" onClick={() => setCommandPaletteOpen(true)}>
            <Search size={14} />
          </IconBtn>
          <IconBtn tip="History">
            <Clock size={14} />
          </IconBtn>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Single editor tab                                                  */
/* ------------------------------------------------------------------ */
function EditorTab({
  tab,
  active,
  onSelect,
  onClose,
}: {
  tab: TabData;
  active: boolean;
  onSelect: () => void;
  onClose: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        padding: '0 10px',
        height: 28,
        background: active ? TOKENS.s3 : 'transparent',
        color: active ? TOKENS.fg1 : TOKENS.fg2,
        borderRadius: 6,
        cursor: 'pointer',
        maxWidth: 180,
        boxShadow: active ? `inset 0 0 0 1px ${TOKENS.stroke}` : 'none',
      }}
    >
      {/* Icon: book for folder, method badge for ivk */}
      {tab.kind === 'folder' ? (
        <BookOpen size={11} style={{ color: active ? TOKENS.amber : TOKENS.fg3, flexShrink: 0 }} />
      ) : (
        tab.method && <MethodBadge method={tab.method} compact />
      )}

      {/* Name */}
      <span
        style={{
          fontSize: 12,
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {tab.name}
      </span>

      {/* Dirty indicator */}
      {tab.dirty && (
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: 9999,
            background: TOKENS.amber,
            flexShrink: 0,
          }}
        />
      )}

      {/* Close button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        style={{
          width: 16,
          height: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          border: 'none',
          borderRadius: 3,
          color: TOKENS.fg3,
          cursor: 'pointer',
          flexShrink: 0,
          opacity: active ? 1 : 0.5,
        }}
      >
        <X size={10} />
      </button>
    </div>
  );
}
