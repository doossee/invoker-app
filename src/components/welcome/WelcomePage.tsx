import { useState } from 'react';
import {
  FolderOpen,
  BookOpen,
  Send,
  ArrowRight,
  Terminal,
  FileText,
  Link,
  Sparkles,
} from 'lucide-react';
import type { HttpMethod } from 'ivkjs';
import { useOpenCollection } from '@/hooks/useOpenCollection';
import { useEditorStore } from '@/stores/editor-store';
import {
  TOKENS,
  InvokerMark,
  PrimaryBtn,
  GhostBtn,
  Tile,
  TileHeader,
  Chip,
  Kbd,
  LearnCard,
} from '@/components/shared/primitives';

const METHOD_COLOR: Record<HttpMethod, string> = {
  GET: 'var(--ivk-method-get)',
  POST: 'var(--ivk-method-post)',
  PUT: 'var(--ivk-method-put)',
  PATCH: 'var(--ivk-method-patch)',
  DELETE: 'var(--ivk-method-delete)',
};

export function WelcomePage() {
  const { openCollection, loadSample, loading, canOpenFolder, isTauriApp, hasBrowserApi } = useOpenCollection();
  const setCommandPaletteOpen = useEditorStore((s) => s.setCommandPaletteOpen);
  const createInlineTab = useEditorStore((s) => s.createInlineTab);

  const [quickMethod, setQuickMethod] = useState<HttpMethod>('GET');
  const [quickUrl, setQuickUrl] = useState('');

  const handleQuickSend = () => {
    const url = quickUrl.trim();
    createInlineTab({ method: quickMethod, url: url || undefined });
    setQuickUrl('');
  };

  const folderButtonLabel = isTauriApp
    ? 'Choose folder...'
    : hasBrowserApi
      ? 'Choose folder...'
      : 'Folder picker unavailable';

  const folderButtonTitle = isTauriApp
    ? 'Open a folder of .ivk and .md files'
    : hasBrowserApi
      ? 'Open a folder via the File System Access API'
      : 'Your browser does not support window.showDirectoryPicker — try Chrome or Edge, or use "Try sample" below';

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
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 36 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              background: 'rgba(230,193,136,0.08)',
              boxShadow: `inset 0 0 0 1px ${TOKENS.strokeHot}`,
            }}
          >
            <InvokerMark size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontFamily: "'Manrope', sans-serif",
                fontWeight: 600,
                fontSize: 26,
                letterSpacing: '-0.02em',
                lineHeight: 1.15,
                color: TOKENS.fg1,
              }}
            >
              A git-native API workspace.
            </div>
            <div style={{ marginTop: 10, color: TOKENS.fg2, fontSize: 13, maxWidth: 520, lineHeight: 1.5 }}>
              Requests live as plain{' '}
              <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: TOKENS.amber }}>.ivk</code>{' '}
              files next to their code. Docs are{' '}
              <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: TOKENS.amber }}>README.md</code>{' '}
              in folders. Publish as a static site — no server, no account.
            </div>
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
          {/* TILE 1 — Open Collection */}
          <Tile gradient style={{ gridColumn: 'span 3', gridRow: 'span 2', padding: 22 }}>
            <TileHeader icon={<FolderOpen size={14} />} label="Open folder" />
            <div
              style={{
                marginTop: 14,
                fontFamily: "'Manrope', sans-serif",
                fontWeight: 600,
                fontSize: 22,
                letterSpacing: '-0.01em',
                lineHeight: 1.2,
                color: TOKENS.fg1,
              }}
            >
              Point Invoker at a folder of .ivk and .md files.
            </div>
            <div style={{ marginTop: 8, color: TOKENS.fg2, fontSize: 13, lineHeight: 1.5 }}>
              Everything stays on your disk. No sign-in, no sync, no cloud.
            </div>
            <div style={{ marginTop: 22, display: 'flex', gap: 8 }}>
              <PrimaryBtn onClick={openCollection} disabled={loading || !canOpenFolder} title={folderButtonTitle}>
                <FolderOpen size={13} />
                {folderButtonLabel}
              </PrimaryBtn>
              <GhostBtn onClick={loadSample} title="Load a built-in sample collection so you can explore Invoker without a real folder">
                <Sparkles size={13} />
                Try sample
              </GhostBtn>
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ marginTop: 24, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Chip icon={<FileText size={10} />}>.ivk format</Chip>
              <Chip icon={<BookOpen size={10} />}>README.md</Chip>
              <Chip icon={<Link size={10} />}>Git-native</Chip>
            </div>
          </Tile>

          {/* TILE 2 — New Request */}
          <Tile style={{ gridColumn: 'span 3', gridRow: 'span 1', padding: 18 }}>
            <TileHeader icon={<Send size={13} />} label="New request" />
            <div
              style={{
                marginTop: 8,
                fontFamily: "'Manrope', sans-serif",
                fontWeight: 600,
                fontSize: 17,
                color: TOKENS.fg1,
              }}
            >
              Fire a request without a collection.
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12 }}>
              <div
                style={{
                  flex: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0,
                  height: 30,
                  borderRadius: 8,
                  background: TOKENS.s3,
                  boxShadow: `inset 0 0 0 1px ${TOKENS.stroke}`,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  overflow: 'hidden',
                }}
              >
                <select
                  value={quickMethod}
                  onChange={(e) => setQuickMethod(e.target.value as HttpMethod)}
                  style={{
                    padding: '0 18px 0 10px',
                    fontWeight: 700,
                    color: METHOD_COLOR[quickMethod],
                    borderRight: `1px solid ${TOKENS.strokeSoft}`,
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    background: 'transparent',
                    border: 'none',
                    appearance: 'none',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: 11,
                    outline: 'none',
                  }}
                >
                  {(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as HttpMethod[]).map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={quickUrl}
                  onChange={(e) => setQuickUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleQuickSend();
                  }}
                  placeholder="https://..."
                  style={{
                    flex: 1,
                    padding: '0 10px',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: TOKENS.fg1,
                    fontFamily: 'inherit',
                    fontSize: 11,
                  }}
                />
              </div>
              <PrimaryBtn onClick={handleQuickSend}>
                <ArrowRight size={13} />
              </PrimaryBtn>
            </div>
          </Tile>

          {/* TILE 3 — Command Palette
              (Was: Recent (span 2) + Palette (span 1). The Recent tile was
              hardcoded fake content — `OVI Internal / Stripe Playbook /
              Acme Webhooks` with title="…wiring pending" — and no recent-
              collections store ever shipped. Following the precedent of
              PR #34 / #23, drop until a real feature exists; widen
              Palette to fill the freed columns so the bento grid stays
              balanced.) */}
          <Tile
            style={{ gridColumn: 'span 3', padding: 18, alignItems: 'flex-start', cursor: 'pointer' }}
          >
            <div onClick={() => setCommandPaletteOpen(true)} style={{ width: '100%' }}>
              <TileHeader icon={<Terminal size={13} />} label="Palette" />
              <div style={{ flex: 1, minHeight: 30 }} />
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <Kbd>⌘</Kbd>
                <Kbd>K</Kbd>
              </div>
              <div style={{ marginTop: 8, fontSize: 11, color: TOKENS.fg2 }}>Do anything.</div>
            </div>
          </Tile>
        </div>

        {/* ============ SIGNAL LINE ============ */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: TOKENS.strokeSoft }} />
          <div
            style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: 11,
              fontWeight: 600,
              color: TOKENS.fg3,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            LEARN · 3 MIN
          </div>
          <div style={{ flex: 1, height: 1, background: TOKENS.strokeSoft }} />
        </div>

        {/* ============ LEARN GRID ============ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <LearnCard
            n="01"
            title="The .ivk format"
            body="Plain text. Git-friendly. Variables with double braces — {{baseUrl}}."
          />
          <LearnCard
            n="02"
            title="Folder = Docs"
            body="Add README.md to any folder. Invoker shows it as documentation."
          />
          <LearnCard
            n="03"
            title="Publish to web"
            body={
              <>
                <code
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 12,
                    color: TOKENS.amber,
                    padding: '1px 6px',
                    borderRadius: 4,
                    background: TOKENS.s3,
                    boxShadow: `inset 0 0 0 1px ${TOKENS.strokeSoft}`,
                  }}
                >
                  npm run invoker:build
                </code>{' '}
                ships a static site.
              </>
            }
          />
        </div>
      </div>
    </div>
  );
}
