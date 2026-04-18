import { ChevronRight } from 'lucide-react';
import { TOKENS } from '@/components/shared/primitives';
import { useEditorStore, type TabData } from '@/stores/editor-store';
import { useCollectionStore } from '@/stores/collection-store';

interface Props {
  parts: string[];
}

export function Breadcrumb({ parts }: Props) {
  const openTab = useEditorStore((s) => s.openTab);

  const handleClick = (index: number) => {
    if (index === 0) {
      // Click "My Collection" -> go to welcome (close active tab)
      useEditorStore.getState().setActiveTab('');
      return;
    }
    // Click intermediate folder -> open folder README tab
    if (index < parts.length - 1) {
      const folderPath = parts.slice(1, index + 1).join('/');
      const tab: TabData = {
        kind: 'folder',
        path: folderPath,
        name: parts[index],
        hasReadme: true,
      };
      openTab(tab);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 11,
        color: TOKENS.fg3,
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      {parts.map((p, i) => (
        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={() => handleClick(i)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: i < parts.length - 1 ? 'pointer' : 'default',
              color: i === parts.length - 1 ? TOKENS.fg1 : TOKENS.fg3,
              fontFamily: 'inherit',
              fontSize: 'inherit',
              padding: 0,
            }}
          >
            {p}
          </button>
          {i < parts.length - 1 && (
            <ChevronRight size={10} style={{ color: TOKENS.fg4 }} />
          )}
        </span>
      ))}
    </div>
  );
}
