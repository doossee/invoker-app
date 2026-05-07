// src/components/welcome/CollectionDashboard.tsx
import { useMemo } from 'react';
import { useCollectionStore } from '@/stores/collection-store';
import { useDocsStore } from '@/stores/docs-store';
import { TOKENS, InvokerMark } from '@/components/shared/primitives';
import { PinnedColumn } from './PinnedColumn';
import { RecentColumn } from './RecentColumn';

/**
 * Functional jumping board shown when a collection is loaded but no
 * tab is active. Replaces the bento dashboard from earlier iterations
 * (per the 2026-05-07 redesign spec). Two-column layout: Pinned left,
 * Recent right; stacks under 700px viewport via auto-fit grid.
 */
export function CollectionDashboard() {
  const files = useCollectionStore((s) => s.files);
  const docs = useDocsStore((s) => s.docs);
  const basePath = useCollectionStore((s) => s.collectionPath) ?? '';

  const meta = useMemo(() => {
    const folders = new Set<string>();
    for (const f of files) {
      const parts = f.path.split('/');
      if (parts.length > 1) folders.add(parts.slice(0, -1).join('/'));
    }
    return {
      reqs: files.length,
      docs: docs.length,
      folders: folders.size,
    };
  }, [files, docs]);

  const collectionName =
    basePath === '(sample)'
      ? 'Sample collection'
      : basePath.split('/').pop() || basePath || 'Your collection';

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
      <div style={{ maxWidth: 1040, margin: '0 auto', padding: '32px 32px 48px' }}>
        {/* Compact hero — single row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 28,
            color: TOKENS.fg2,
            fontSize: 12,
          }}
        >
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              background: 'rgba(230,193,136,0.08)',
              boxShadow: `inset 0 0 0 1px ${TOKENS.strokeHot}`,
            }}
          >
            <InvokerMark size={12} />
          </div>
          <span style={{ color: TOKENS.fg1, fontSize: 14, fontWeight: 600 }}>
            {collectionName}
          </span>
          <span>·</span>
          <span>{meta.reqs} reqs</span>
          <span>·</span>
          <span>{meta.docs} docs</span>
          <span>·</span>
          <span>{meta.folders} folders</span>
        </div>

        {/* Two-column working surface */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 24,
          }}
        >
          <PinnedColumn />
          <RecentColumn />
        </div>
      </div>
    </div>
  );
}
