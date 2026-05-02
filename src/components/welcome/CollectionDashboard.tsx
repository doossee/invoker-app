import { useMemo } from 'react';
import {
  BookOpen,
  Plus,
  Send,
  Terminal,
  FileText,
  RefreshCw,
} from 'lucide-react';
import { parseIvk, type HttpMethod } from 'ivkjs';
import { useCollectionStore } from '@/stores/collection-store';
import { useDocsStore } from '@/stores/docs-store';
import { useEditorStore, type TabData } from '@/stores/editor-store';
import { useOpenCollection } from '@/hooks/useOpenCollection';
import {
  TOKENS,
  InvokerMark,
  PrimaryBtn,
  GhostBtn,
  Tile,
  TileHeader,
  Kbd,
  MethodBadge,
} from '@/components/shared/primitives';

/**
 * Rendered instead of the WelcomePage once a collection is loaded and no
 * tab is currently active. Acts as a collection-level dashboard: shows
 * what's loaded, lets you jump to recent files, and exposes the same
 * quick-request + palette affordances the welcome page had.
 */
export function CollectionDashboard() {
  const files = useCollectionStore((s) => s.files);
  const docs = useDocsStore((s) => s.docs);
  const basePath = useCollectionStore((s) => s.collectionPath) ?? '';
  const openTab = useEditorStore((s) => s.openTab);
  const createInlineTab = useEditorStore((s) => s.createInlineTab);
  const setCommandPaletteOpen = useEditorStore((s) => s.setCommandPaletteOpen);

  const { openCollection, loading, canOpenFolder } = useOpenCollection();

  const { folderCount, requestCount, docCount } = useMemo(() => {
    const folders = new Set<string>();
    for (const f of files) {
      const parts = f.path.split('/');
      if (parts.length > 1) folders.add(parts.slice(0, -1).join('/'));
    }
    return { folderCount: folders.size, requestCount: files.length, docCount: docs.length };
  }, [files, docs]);

  // "Recently added" = last 5 requests (sorted by path; we don't track
  // real access timestamps yet, so this is just a consistent sample).
  const recent = useMemo(() => files.slice(0, 5), [files]);

  const collectionName = basePath === '(sample)' ? 'Sample collection' : basePath.split('/').pop() || basePath || 'Your collection';

  return (
    <div
      style={{
        height: '100%',
        overflow: 'auto',
        background: TOKENS.s1,
        color: TOKENS.fg1,
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <div style={{ maxWidth: 1040, margin: '0 auto', padding: '48px 40px 64px' }}>
        {/* ============ HERO ============ */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 36 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              background: 'rgba(230,193,136,0.08)',
              boxShadow: `inset 0 0 0 1px ${TOKENS.strokeHot}`,
            }}
          >
            <InvokerMark size={30} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: "'Manrope', sans-serif",
                fontWeight: 700,
                fontSize: 30,
                letterSpacing: '-0.02em',
                lineHeight: 1.15,
                color: TOKENS.fg1,
              }}
            >
              {collectionName}
            </div>
            <div style={{ marginTop: 8, display: 'flex', gap: 14, color: TOKENS.fg3, fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>
              <span>
                <span style={{ color: TOKENS.fg1, fontWeight: 600 }}>{requestCount}</span> request{requestCount === 1 ? '' : 's'}
              </span>
              <span>
                <span style={{ color: TOKENS.fg1, fontWeight: 600 }}>{docCount}</span> doc{docCount === 1 ? '' : 's'}
              </span>
              <span>
                <span style={{ color: TOKENS.fg1, fontWeight: 600 }}>{folderCount}</span> folder{folderCount === 1 ? '' : 's'}
              </span>
              {basePath && basePath !== '(sample)' && (
                <span style={{ color: TOKENS.fg4 }}>· {basePath}</span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <GhostBtn onClick={openCollection} disabled={loading || !canOpenFolder} title={canOpenFolder ? 'Open a different folder' : 'Folder picker unavailable in this browser'}>
              <RefreshCw size={13} />
              Change folder
            </GhostBtn>
            <PrimaryBtn onClick={() => createInlineTab()}>
              <Plus size={13} />
              New request
            </PrimaryBtn>
          </div>
        </div>

        {/* ============ BENTO GRID ============ */}
        <div
          style={{
            display: 'grid',
            gap: 12,
            gridTemplateColumns: 'repeat(6, 1fr)',
            gridTemplateRows: 'repeat(2, minmax(140px, auto))',
            marginBottom: 40,
          }}
        >
          {/* Recent requests */}
          <Tile style={{ gridColumn: 'span 3', gridRow: 'span 2', padding: 22 }}>
            <TileHeader icon={<FileText size={13} />} label="Requests" />
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 2, flex: 1, overflow: 'auto' }}>
              {recent.length === 0 && (
                <div style={{ color: TOKENS.fg3, fontSize: 13, fontStyle: 'italic' }}>
                  No requests in this collection yet.
                </div>
              )}
              {recent.map((f) => {
                let method: HttpMethod = 'GET';
                try { method = parseIvk(f.content).method; } catch { /* ignore */ }
                const name = f.path.split('/').pop()?.replace('.ivk', '') ?? f.path;
                const parent = f.path.includes('/') ? f.path.split('/').slice(0, -1).join('/') : '';
                return (
                  <button
                    key={f.path}
                    onClick={() => {
                      const tab: TabData = { kind: 'ivk', path: f.path, name, method };
                      openTab(tab);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 10px',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: 7,
                      cursor: 'pointer',
                      color: TOKENS.fg1,
                      fontFamily: 'inherit',
                      textAlign: 'left',
                    }}
                  >
                    <MethodBadge method={method} compact />
                    <span style={{ fontSize: 13, color: TOKENS.fg1, flexShrink: 0 }}>{name}</span>
                    {parent && (
                      <span style={{ fontSize: 11, color: TOKENS.fg3, fontFamily: "'JetBrains Mono', monospace", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {parent}
                      </span>
                    )}
                  </button>
                );
              })}
              {files.length > recent.length && (
                <div style={{ marginTop: 8, fontSize: 11, color: TOKENS.fg3 }}>
                  {files.length - recent.length} more in sidebar.
                </div>
              )}
            </div>
          </Tile>

          {/* Docs */}
          <Tile style={{ gridColumn: 'span 3', gridRow: 'span 1', padding: 18 }}>
            <TileHeader icon={<BookOpen size={13} />} label="Docs" />
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4, flex: 1, overflow: 'auto' }}>
              {docs.length === 0 && (
                <div style={{ fontSize: 12, color: TOKENS.fg3, fontStyle: 'italic' }}>
                  No .md files in this collection.
                </div>
              )}
              {docs.slice(0, 3).map((d) => {
                const name = d.path.split('/').pop()?.replace('.md', '') ?? d.path;
                // Treat <folder>/README.md as a folder tab (so the inner
                // Files tab works). Top-level README.md is just a doc.
                const isFolderReadme = /\/readme\.md$/i.test(d.path);
                return (
                  <button
                    key={d.path}
                    onClick={() => {
                      const tab: TabData = isFolderReadme
                        ? { kind: 'folder', path: d.path.replace(/\/readme\.md$/i, ''), name, hasReadme: true }
                        : { kind: 'doc', path: d.path, name };
                      openTab(tab);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '5px 8px',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      color: TOKENS.fg1,
                      fontFamily: 'inherit',
                      fontSize: 12,
                      textAlign: 'left',
                    }}
                  >
                    <BookOpen size={11} style={{ color: TOKENS.fg3, flexShrink: 0 }} />
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.title}</span>
                  </button>
                );
              })}
            </div>
          </Tile>

          {/* New request tile */}
          <Tile style={{ gridColumn: 'span 2', padding: 18 }}>
            <TileHeader icon={<Send size={13} />} label="New request" />
            <div style={{ flex: 1, minHeight: 8 }} />
            <PrimaryBtn onClick={() => createInlineTab()}>
              <Plus size={13} />
              Create
            </PrimaryBtn>
          </Tile>

          {/* Command palette tile */}
          <Tile style={{ gridColumn: 'span 1', padding: 18, cursor: 'pointer' }}>
            <div onClick={() => setCommandPaletteOpen(true)} style={{ width: '100%', display: 'flex', flexDirection: 'column', flex: 1 }}>
              <TileHeader icon={<Terminal size={13} />} label="Palette" />
              <div style={{ flex: 1, minHeight: 20 }} />
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <Kbd>⌘</Kbd>
                <Kbd>K</Kbd>
              </div>
              <div style={{ marginTop: 6, fontSize: 11, color: TOKENS.fg2 }}>Jump anywhere.</div>
            </div>
          </Tile>
        </div>

        {/* ============ FOOTER HINT ============ */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 4 }}>
          <div style={{ flex: 1, height: 1, background: TOKENS.strokeSoft }} />
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: TOKENS.fg3, letterSpacing: '0.12em' }}>
            OPEN A FILE FROM THE SIDEBAR
          </div>
          <div style={{ flex: 1, height: 1, background: TOKENS.strokeSoft }} />
        </div>
      </div>
    </div>
  );
}
