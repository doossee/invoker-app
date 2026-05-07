// src/components/welcome/PinnedColumn.tsx
import { useMemo } from 'react';
import { Folder } from 'lucide-react';
import { parseIvk, type HttpMethod } from 'ivkjs';
import { useCollectionStore } from '@/stores/collection-store';
import { useDocsStore } from '@/stores/docs-store';
import { useEditorStore, type TabData } from '@/stores/editor-store';
import { usePinnedStore } from '@/stores/pinned-store';
import { TOKENS, MethodBadge } from '@/components/shared/primitives';

/**
 * Two-column dashboard's left side. Lists user-pinned paths (set via
 * UnifiedTree right-click → Pin). Stale paths (no longer in the loaded
 * collection) render muted with a `(missing)` suffix so the user can
 * see they exist but are unreachable until restored (e.g. after a
 * `git pull` re-adds the file, the pin reactivates).
 */
export function PinnedColumn() {
  const pinnedPaths = usePinnedStore((s) => s.pinnedPaths);
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
      { kind: 'ivk' | 'doc' | 'folder'; method?: string; folder?: string; name: string }
    >();
    for (const f of files) {
      const parts = f.path.split('/');
      const name = (parts.pop() ?? '').replace(/\.ivk$/, '');
      let method: string | undefined;
      try {
        method = parseIvk(f.content)?.method ?? undefined;
      } catch {
        method = undefined;
      }
      m.set(f.path, { kind: 'ivk', method, folder: parts.join('/'), name });
    }
    for (const d of docs) {
      const parts = d.path.split('/');
      const name = (parts.pop() ?? '').replace(/\.md$/, '');
      m.set(d.path, { kind: 'doc', folder: parts.join('/'), name });
    }
    for (const folder of folderPaths) {
      const parts = folder.split('/');
      const name = parts.pop() ?? folder;
      m.set(folder, { kind: 'folder', folder: parts.join('/'), name });
    }
    return m;
  }, [files, docs, folderPaths]);

  const handleClick = (path: string) => {
    const meta = knownFile.get(path);
    if (!meta) return; // stale — no-op (could surface a toast later)
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
      <SectionHeader label="Pinned" count={pinnedPaths.length} />
      {pinnedPaths.length === 0 ? (
        <div style={{ fontSize: 12, color: TOKENS.fg3, padding: '4px 8px' }}>
          Pin a request from the sidebar (right-click → Pin).
        </div>
      ) : (
        pinnedPaths.map((path) => {
          const meta = knownFile.get(path);
          const stale = !meta;
          return (
            <button
              key={path}
              onClick={() => handleClick(path)}
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
                {meta?.name ?? path.split('/').pop()}
              </span>
              {stale ? (
                <span style={{ fontSize: 10, color: TOKENS.fg3 }}>(missing)</span>
              ) : meta?.folder ? (
                <span style={{ fontSize: 10, color: TOKENS.fg3 }}>{meta.folder}/</span>
              ) : null}
            </button>
          );
        })
      )}
    </div>
  );
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
