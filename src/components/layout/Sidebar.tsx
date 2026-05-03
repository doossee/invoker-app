import type { ReactNode } from 'react';
import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Plus,
  Settings,
  Search,
  ChevronDown,
  ChevronUp,
  Globe,
  FolderOpen,
  Sparkles,
} from 'lucide-react';
import { InvokerMark, Kbd, TOKENS } from '@/components/shared/primitives';
import { useEditorStore } from '@/stores/editor-store';
import { useEnvStore } from '@/stores/env-store';
import { useCollectionStore } from '@/stores/collection-store';
import { useDocsStore } from '@/stores/docs-store';
import { useOpenCollection } from '@/hooks/useOpenCollection';

const ENV_COLORS: Record<string, string> = {
  development: '#22c55e',
  dev: '#22c55e',
  staging: '#e0af68',
  stage: '#e0af68',
  production: '#f97758',
  prod: '#f97758',
};

interface Props {
  children: ReactNode;
  onOpenSettings: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export function Sidebar({ children, onOpenSettings, searchQuery, onSearchChange }: Props) {
  const openCommandPalette = useEditorStore((s) => s.setCommandPaletteOpen);
  const setEnvSettingsOpen = useEditorStore((s) => s.setEnvSettingsOpen);
  const createInlineTab = useEditorStore((s) => s.createInlineTab);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: TOKENS.s2,
        borderRadius: 14,
        boxShadow: `inset 0 0 0 1px ${TOKENS.stroke}`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Collection Switcher */}
      <CollectionHeader />

      {/* Search Bar */}
      <div style={{ padding: '0 10px 8px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 8px',
            background: TOKENS.s3,
            borderRadius: 7,
            boxShadow: `inset 0 0 0 1px ${TOKENS.strokeSoft}`,
          }}
        >
          <Search size={11} style={{ color: TOKENS.fg3, flexShrink: 0 }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search requests..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: TOKENS.fg1,
              fontSize: 12,
              fontFamily: 'inherit',
            }}
          />
          <Kbd>⌘K</Kbd>
        </div>
      </div>

      {/* Divider */}
      <div style={{ margin: '0 10px', height: 1, background: TOKENS.strokeSoft }} />

      {/* New Request Button */}
      <div style={{ padding: '8px 10px' }}>
        <div
          style={{
            display: 'flex',
            width: '100%',
            borderRadius: 8,
            overflow: 'hidden',
            boxShadow: `inset 0 0 0 1px ${TOKENS.strokeSoft}`,
            background: TOKENS.s3,
          }}
        >
          <button
            onClick={() => createInlineTab()}
            title="Create a new untitled request (⌘N)"
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              background: 'transparent',
              border: 'none',
              color: TOKENS.fg1,
              fontSize: 12,
              fontFamily: 'inherit',
              cursor: 'pointer',
            }}
          >
            <Plus size={12} />
            New Request
          </button>
          <div style={{ width: 1, background: TOKENS.strokeSoft }} />
          <button
            onClick={() => openCommandPalette(true)}
            title="Open command palette (⌘K)"
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0 8px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <ChevronDown size={11} style={{ color: TOKENS.fg2 }} />
          </button>
        </div>
      </div>

      {/* File Tree */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 4px' }}>
        {children}
      </div>

      {/* Footer: Env pill + Settings */}
      <EnvFooter
        onOpenSettings={onOpenSettings}
        onManageEnv={() => setEnvSettingsOpen(true)}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Collection Header                                                  */
/* ------------------------------------------------------------------ */
function CollectionHeader() {
  const files = useCollectionStore((s) => s.files);
  const docs = useDocsStore((s) => s.docs);
  const collectionPath = useCollectionStore((s) => s.collectionPath);
  const [menuOpen, setMenuOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  // Click-outside to close.
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const escHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('mousedown', handler);
    window.addEventListener('keydown', escHandler);
    return () => {
      window.removeEventListener('mousedown', handler);
      window.removeEventListener('keydown', escHandler);
    };
  }, [menuOpen]);

  const { name, summary } = useMemo(() => {
    const folders = new Set<string>();
    for (const f of files) {
      const parts = f.path.split('/');
      if (parts.length > 1) folders.add(parts.slice(0, -1).join('/'));
    }
    const reqs = files.length;
    const nfolders = folders.size;
    const ndocs = docs.length;

    if (reqs === 0 && ndocs === 0) {
      return { name: 'No collection', summary: 'Open a folder to start' };
    }
    const name = collectionPath === '(sample)' ? 'Sample collection' : collectionPath?.split('/').pop() || 'My Collection';
    const parts: string[] = [];
    parts.push(`${reqs} request${reqs === 1 ? '' : 's'}`);
    if (ndocs > 0) parts.push(`${ndocs} doc${ndocs === 1 ? '' : 's'}`);
    if (nfolders > 0) parts.push(`${nfolders} folder${nfolders === 1 ? '' : 's'}`);
    return { name, summary: parts.join(' · ') };
  }, [files, docs, collectionPath]);

  const hasCollection = files.length > 0 || docs.length > 0;

  return (
    <div ref={wrapperRef} style={{ padding: '10px 10px 6px', position: 'relative' }}>
      <button
        onClick={() => setMenuOpen((open) => !open)}
        title="Switch or open collection"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          width: '100%',
          padding: '6px 8px',
          background: menuOpen ? TOKENS.s3 : 'transparent',
          border: 'none',
          borderRadius: 8,
          cursor: 'pointer',
        }}
      >
        <InvokerMark size={14} color={hasCollection ? TOKENS.amber : TOKENS.fg3} />
        <div style={{ flex: 1, minWidth: 0, textAlign: 'left' as const }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: hasCollection ? TOKENS.amber : TOKENS.fg2,
              lineHeight: 1.2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {name}
          </div>
          <div style={{ fontSize: 10, color: TOKENS.fg3, marginTop: 1 }}>
            {summary}
          </div>
        </div>
        <ChevronUp
          size={11}
          style={{
            color: TOKENS.fg3,
            transform: menuOpen ? 'rotate(0deg)' : 'rotate(180deg)',
            transition: 'transform 0.15s',
          }}
        />
      </button>

      {menuOpen && <CollectionDropdown onClose={() => setMenuOpen(false)} />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Collection switcher dropdown                                       */
/* ------------------------------------------------------------------ */
function CollectionDropdown({ onClose }: { onClose: () => void }) {
  const { openCollection, loadSample, loading, canOpenFolder } = useOpenCollection();
  const collectionPath = useCollectionStore((s) => s.collectionPath);

  const isSample = collectionPath === '(sample)';

  return (
    <div
      style={{
        position: 'absolute',
        top: '100%',
        left: 10,
        right: 10,
        marginTop: 4,
        background: TOKENS.s1,
        border: `1px solid ${TOKENS.fg4}`,
        borderRadius: 8,
        padding: 4,
        boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
        zIndex: 50,
      }}
    >
      <DropdownButton
        icon={<FolderOpen size={12} style={{ color: TOKENS.amber }} />}
        label={canOpenFolder ? 'Open folder…' : 'Open folder (unavailable)'}
        hint={canOpenFolder ? 'Pick a folder of .ivk and .md files' : 'Browser folder picker not supported here'}
        disabled={!canOpenFolder || loading}
        onClick={async () => {
          await openCollection();
          onClose();
        }}
      />
      <DropdownButton
        icon={<Sparkles size={12} style={{ color: TOKENS.amber }} />}
        label={isSample ? 'Reload sample collection' : 'Try sample collection'}
        hint="Built-in demo collection, lives only in memory"
        onClick={() => {
          loadSample();
          onClose();
        }}
      />
    </div>
  );
}

function DropdownButton({
  icon,
  label,
  hint,
  disabled,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  hint?: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={hint}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
        width: '100%',
        padding: '6px 10px',
        background: 'transparent',
        border: 'none',
        borderRadius: 5,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        textAlign: 'left' as const,
        fontFamily: 'inherit',
      }}
    >
      <span style={{ marginTop: 2 }}>{icon}</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, color: TOKENS.fg1, lineHeight: 1.2 }}>{label}</div>
        {hint && <div style={{ fontSize: 10, color: TOKENS.fg3, marginTop: 2 }}>{hint}</div>}
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Env Footer                                                         */
/* ------------------------------------------------------------------ */
function EnvFooter({
  onOpenSettings,
  onManageEnv,
}: {
  onOpenSettings: () => void;
  onManageEnv: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const settings = useEnvStore((s) => s.settings);

  const activeEnv = settings.environments[settings.activeEnvironmentIndex];
  const envName = activeEnv?.name ?? 'No environment';
  const dotColor = ENV_COLORS[envName.toLowerCase()] ?? TOKENS.fg3;

  return (
    <div
      style={{
        padding: '8px 10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: `inset 0 1px 0 ${TOKENS.strokeSoft}`,
        position: 'relative' as const,
      }}
    >
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 8px',
          background: 'transparent',
          border: 'none',
          borderRadius: 6,
          cursor: 'pointer',
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: 9999,
            background: dotColor,
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: 11, color: TOKENS.fg2 }}>{envName}</span>
        <ChevronDown
          size={10}
          style={{
            color: TOKENS.fg3,
            transform: menuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s',
          }}
        />
      </button>

      {/* Env dropdown */}
      {menuOpen && (
        <EnvDropdown
          onClose={() => setMenuOpen(false)}
          onManage={onManageEnv}
        />
      )}

      <button
        onClick={onOpenSettings}
        title="Settings"
        style={{
          width: 28,
          height: 28,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          border: 'none',
          borderRadius: 6,
          color: TOKENS.fg2,
          cursor: 'pointer',
        }}
      >
        <Settings size={14} />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Env Dropdown                                                       */
/* ------------------------------------------------------------------ */
function EnvDropdown({ onClose, onManage }: { onClose: () => void; onManage: () => void }) {
  const settings = useEnvStore((s) => s.settings);
  const setActiveEnv = useEnvStore((s) => s.setActiveEnv);

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '100%',
        left: 0,
        marginBottom: 4,
        width: 180,
        background: TOKENS.s1,
        border: `1px solid ${TOKENS.fg4}`,
        borderRadius: 8,
        padding: 4,
        boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
        zIndex: 50,
      }}
    >
      {settings.environments.map((env, idx) => {
        const color = ENV_COLORS[env.name.toLowerCase()] ?? TOKENS.fg3;
        const isActive = idx === settings.activeEnvironmentIndex;
        return (
          <button
            key={idx}
            onClick={() => {
              setActiveEnv(idx);
              onClose();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              width: '100%',
              padding: '6px 10px',
              fontSize: 12,
              background: isActive ? TOKENS.s4 : 'transparent',
              border: 'none',
              cursor: 'pointer',
              borderRadius: 4,
              color: isActive ? TOKENS.fg1 : TOKENS.fg2,
              fontFamily: 'inherit',
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: 9999,
                background: isActive ? color : '#444',
                flexShrink: 0,
              }}
            />
            {env.name}
          </button>
        );
      })}
      <div style={{ height: 1, background: TOKENS.strokeSoft, margin: '4px 0' }} />
      <button
        onClick={() => {
          onManage();
          onClose();
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          width: '100%',
          padding: '6px 10px',
          fontSize: 12,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          borderRadius: 4,
          color: TOKENS.fg3,
          fontFamily: 'inherit',
        }}
      >
        <Globe size={11} />
        Manage environments...
      </button>
    </div>
  );
}
