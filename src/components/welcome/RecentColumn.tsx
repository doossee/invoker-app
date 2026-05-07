// src/components/welcome/RecentColumn.tsx
import { useMemo } from 'react';
import { Folder } from 'lucide-react';
import { parseIvk, type HttpMethod } from 'ivkjs';
import { useCollectionStore } from '@/stores/collection-store';
import { useDocsStore } from '@/stores/docs-store';
import { useEditorStore, type TabData } from '@/stores/editor-store';
import { useRecentStore } from '@/stores/recent-store';
import { TOKENS, MethodBadge } from '@/components/shared/primitives';

/**
 * Two-column dashboard's right side. Lists recently opened paths (LRU,
 * cap 15, head-first). Same stale-path treatment as PinnedColumn — a
 * `(missing)` suffix replaces the relative-time pill when the path is
 * no longer present in the loaded collection.
 */
export function RecentColumn() {
  const recent = useRecentStore((s) => s.recent);
  const files = useCollectionStore((s) => s.files);
  const docs = useDocsStore((s) => s.docs);
  const openTab = useEditorStore((s) => s.openTab);

  const folderPaths = useMemo(() => {
    const set = new Set<string>();
    for (const f of files) {
      const parts = f.path.split('/');
      for (let i = 1; i < parts.length; i++) {
        set.add(parts.slice(0, i).join('/'));
      }
    }
    return set;
  }, [files]);

  const knownFile = useMemo(() => {
    const m = new Map<
      string,
      { kind: 'ivk' | 'doc' | 'folder'; method?: string; name: string }
    >();
    for (const f of files) {
      const name = (f.path.split('/').pop() ?? '').replace(/\.ivk$/, '');
      let method: string | undefined;
      try {
        method = parseIvk(f.content)?.method ?? undefined;
      } catch {
        method = undefined;
      }
      m.set(f.path, { kind: 'ivk', method, name });
    }
    for (const d of docs) {
      const name = (d.path.split('/').pop() ?? '').replace(/\.md$/, '');
      m.set(d.path, { kind: 'doc', name });
    }
    for (const folder of folderPaths) {
      const name = folder.split('/').pop() ?? folder;
      m.set(folder, { kind: 'folder', name });
    }
    return m;
  }, [files, docs, folderPaths]);

  const handleClick = (path: string) => {
    const meta = knownFile.get(path);
    if (!meta) return;
    const tab: TabData = {
      kind: meta.kind,
      path,
      name: meta.name,
      method: meta.kind === 'ivk' ? meta.method : undefined,
      hasReadme: meta.kind === 'folder' || undefined,
    };
    openTab(tab);
  };

  return (
    <div>
      <SectionHeader label="Recent" count={recent.length} />
      {recent.length === 0 ? (
        <div style={{ fontSize: 12, color: TOKENS.fg3, padding: '4px 8px' }}>
          Open a request to start building history.
        </div>
      ) : (
        recent.map((entry) => {
          const meta = knownFile.get(entry.path);
          const stale = !meta;
          return (
            <button
              key={entry.path}
              onClick={() => handleClick(entry.path)}
              disabled={stale}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                padding: '6px 8px',
                background: 'transparent',
                border: 'none',
                borderRadius: 5,
                cursor: stale ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                fontSize: 12,
                color: stale ? TOKENS.fg3 : TOKENS.fg1,
                textAlign: 'left',
                opacity: stale ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (!stale) e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              {meta?.kind === 'folder' && <Folder size={11} style={{ color: TOKENS.fg3 }} />}
              {meta?.kind === 'ivk' && meta.method && (
                <MethodBadge method={meta.method as HttpMethod} compact />
              )}
              {meta?.kind === 'doc' && (
                <span style={{ width: 11, color: TOKENS.fg3, fontSize: 10 }}>md</span>
              )}
              <span
                style={{
                  flex: 1,
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {meta?.name ?? entry.path.split('/').pop()}
              </span>
              <span style={{ fontSize: 10, color: TOKENS.fg3 }}>
                {stale ? '(missing)' : formatRelative(Date.now() - entry.openedAt)}
              </span>
            </button>
          );
        })
      )}
    </div>
  );
}

function formatRelative(deltaMs: number): string {
  if (deltaMs < 60_000) return 'now';
  const minutes = Math.floor(deltaMs / 60_000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function SectionHeader({ label, count }: { label: string; count: number }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 6,
        padding: '6px 8px 4px',
        fontFamily: "'Inter', system-ui, sans-serif",
        fontSize: 11,
        fontWeight: 600,
        color: TOKENS.fg2,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
      }}
    >
      <span>{label}</span>
      <span style={{ color: TOKENS.fg3 }}>{count}</span>
    </div>
  );
}
