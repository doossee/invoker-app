import {
  FolderOpen,
  BookOpen,
  Plus,
  Send,
  ArrowRight,
  Clock,
  Terminal,
  FileText,
  Link,
  Copy,
} from 'lucide-react';
import { isTauri } from '@/lib/platform';
import { useOpenCollection } from '@/hooks/useOpenCollection';

/* ------------------------------------------------------------------ */
/*  Invoker Mark (the arc + dot logo)                                  */
/* ------------------------------------------------------------------ */
function InvokerMark({ size = 16, color = 'var(--ivk-primary)' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" fill="none" className="shrink-0 block">
      <path d="M 56 36 A 20 20 0 1 0 36 56" stroke={color} strokeWidth="10" strokeLinecap="round" />
      <circle cx="56" cy="56" r="6" fill={color} />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Tile primitives                                                    */
/* ------------------------------------------------------------------ */
function Tile({
  children,
  className = '',
  gradient = false,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  gradient?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`bg-surface-low rounded-[14px] p-[18px] flex flex-col ${className}`}
      style={{
        boxShadow: 'inset 0 0 0 1px rgba(66,71,84,0.28)',
        ...(gradient
          ? { background: 'linear-gradient(135deg, rgba(230,193,136,0.06), rgba(230,193,136,0) 60%)' }
          : {}),
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function TileHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 font-mono text-[10px] text-outline tracking-[0.1em] uppercase">
      <span className="text-primary flex">{icon}</span>
      <span>{label}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Buttons                                                            */
/* ------------------------------------------------------------------ */
function PrimaryBtn({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-primary text-on-primary border-none rounded-lg cursor-pointer text-[13px] font-semibold disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function GhostBtn({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-container text-on-surface border-none rounded-lg cursor-pointer text-[13px] font-medium"
      style={{ boxShadow: 'inset 0 0 0 1px rgba(66,71,84,0.28)' }}
    >
      {children}
    </button>
  );
}

function Chip({ children, icon }: { children: React.ReactNode; icon: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-[5px] px-[9px] py-[3px] rounded-full text-[11px] text-on-surface-variant bg-surface-container"
      style={{ boxShadow: 'inset 0 0 0 1px rgba(66,71,84,0.18)' }}
    >
      <span className="text-outline flex">{icon}</span>
      {children}
    </span>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="font-mono text-[10px] font-medium px-[5px] py-[2px] rounded text-on-surface-variant bg-surface-container inline-flex items-center justify-center leading-none"
      style={{
        boxShadow: 'inset 0 0 0 1px rgba(66,71,84,0.28)',
        minWidth: 18,
      }}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Learn card                                                         */
/* ------------------------------------------------------------------ */
function LearnCard({
  n,
  title,
  body,
}: {
  n: string;
  title: string;
  body: React.ReactNode;
}) {
  return (
    <div
      className="bg-surface-low rounded-xl p-4"
      style={{ boxShadow: 'inset 0 0 0 1px rgba(66,71,84,0.28)' }}
    >
      <div className="font-mono text-[11px] text-outline mb-2">{n}</div>
      <div
        className="font-semibold text-[15px] text-on-surface mb-1.5"
        style={{ fontFamily: "'Manrope', sans-serif" }}
      >
        {title}
      </div>
      <div className="text-xs text-on-surface-variant leading-relaxed">{body}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */
export function WelcomePage() {
  const { openCollection, loading } = useOpenCollection();
  const tauriApp = isTauri();

  return (
    <div
      className="h-full overflow-auto bg-surface-lowest text-on-surface"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      <div className="max-w-[1040px] mx-auto" style={{ padding: '48px 40px 64px' }}>
        {/* ============ HERO ============ */}
        <div className="flex items-start gap-5 mb-11">
          <div
            className="w-14 h-14 rounded-[14px] flex items-center justify-center shrink-0"
            style={{
              background: 'rgba(230,193,136,0.08)',
              boxShadow: 'inset 0 0 0 1px rgba(230,193,136,0.35)',
            }}
          >
            <InvokerMark size={30} />
          </div>
          <div className="flex-1">
            <div
              className="text-on-surface leading-[1.1]"
              style={{
                fontFamily: "'Manrope', sans-serif",
                fontWeight: 700,
                fontSize: 34,
                letterSpacing: '-0.02em',
              }}
            >
              A git-native API workspace.
            </div>
            <div className="mt-2.5 text-on-surface-variant text-[15px] max-w-[520px] leading-normal">
              Requests live as plain{' '}
              <code className="font-mono text-[13px] text-primary">.ivk</code> files next to their
              code. Docs are{' '}
              <code className="font-mono text-[13px] text-primary">README.md</code> in folders.
              Publish as a static site — no server, no account.
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <GhostBtn>
              <BookOpen size={13} />
              Docs
            </GhostBtn>
            <PrimaryBtn>
              <Plus size={13} />
              New collection
            </PrimaryBtn>
          </div>
        </div>

        {/* ============ BENTO ============ */}
        <div
          className="grid gap-3 mb-10"
          style={{
            gridTemplateColumns: 'repeat(6, 1fr)',
            gridTemplateRows: 'repeat(2, minmax(140px, auto))',
          }}
        >
          {/* TILE 1 — Open folder — tall */}
          <Tile
            gradient
            className="p-[22px]"
            style={{ gridColumn: 'span 3', gridRow: 'span 2' }}
          >
            <TileHeader icon={<FolderOpen size={14} />} label="Open folder" />
            <div
              className="mt-3.5 text-on-surface leading-[1.2]"
              style={{
                fontFamily: "'Manrope', sans-serif",
                fontWeight: 600,
                fontSize: 22,
                letterSpacing: '-0.01em',
              }}
            >
              Point Invoker at a folder of .ivk and .md files.
            </div>
            <div className="mt-2 text-on-surface-variant text-[13px] leading-normal">
              Everything stays on your disk. No sign-in, no sync, no cloud.
            </div>
            <div className="mt-[22px] flex gap-2">
              {tauriApp ? (
                <PrimaryBtn onClick={openCollection} disabled={loading}>
                  <FolderOpen size={13} />
                  Choose folder...
                </PrimaryBtn>
              ) : (
                <PrimaryBtn disabled>
                  <FolderOpen size={13} />
                  Choose folder...
                </PrimaryBtn>
              )}
              <GhostBtn>
                <Copy size={13} />
                Clone from Git
              </GhostBtn>
            </div>
            <div className="flex-1" />
            <div className="flex gap-2 mt-6 flex-wrap">
              <Chip icon={<FileText size={10} />}>.ivk format</Chip>
              <Chip icon={<BookOpen size={10} />}>README.md</Chip>
              <Chip icon={<Link size={10} />}>Git-native</Chip>
            </div>
          </Tile>

          {/* TILE 2 — New request */}
          <Tile className="p-[18px]" style={{ gridColumn: 'span 3', gridRow: 'span 1' }}>
            <TileHeader icon={<Send size={13} />} label="New request" />
            <div
              className="mt-2 text-on-surface"
              style={{
                fontFamily: "'Manrope', sans-serif",
                fontWeight: 600,
                fontSize: 17,
              }}
            >
              Fire a request without a collection.
            </div>
            <div className="flex-1" />
            <div className="flex gap-2 items-center mt-3">
              <div
                className="inline-flex items-center gap-0 h-[30px] rounded-lg bg-surface-container font-mono text-[11px] text-on-surface-variant overflow-hidden flex-1 min-w-0"
                style={{ boxShadow: 'inset 0 0 0 1px rgba(66,71,84,0.28)' }}
              >
                <span
                  className="px-2.5 font-bold"
                  style={{
                    color: 'var(--ivk-method-get)',
                    borderRight: '1px solid rgba(66,71,84,0.18)',
                  }}
                >
                  GET
                </span>
                <span className="px-2.5 opacity-70">https://...</span>
              </div>
              <PrimaryBtn>
                <ArrowRight size={13} />
              </PrimaryBtn>
            </div>
          </Tile>

          {/* TILE 3 — Recent */}
          <Tile className="p-[18px]" style={{ gridColumn: 'span 2' }}>
            <TileHeader icon={<Clock size={13} />} label="Recent" />
            <div className="mt-2.5 flex flex-col gap-1.5">
              {[
                { n: 'OVI Internal', s: '460 reqs' },
                { n: 'Stripe Playbook', s: '127 reqs' },
                { n: 'Acme Webhooks', s: '14 reqs' },
              ].map((r) => (
                <button
                  key={r.n}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-transparent border-none cursor-pointer text-on-surface"
                  style={{ fontFamily: 'inherit' }}
                >
                  <InvokerMark size={11} color="var(--ivk-outline)" />
                  <span className="flex-1 text-left text-xs">{r.n}</span>
                  <span className="text-[10px] text-outline">{r.s}</span>
                </button>
              ))}
            </div>
          </Tile>

          {/* TILE 4 — Command palette teaser */}
          <Tile
            className="p-[18px] items-start"
            style={{ gridColumn: 'span 1' }}
          >
            <TileHeader icon={<Terminal size={13} />} label="Palette" />
            <div className="flex-1" />
            <div className="flex gap-1 items-center">
              <Kbd>{'\u2318'}</Kbd>
              <Kbd>K</Kbd>
            </div>
            <div className="mt-2 text-[11px] text-on-surface-variant">Do anything.</div>
          </Tile>
        </div>

        {/* ============ SIGNAL LINE ============ */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="flex-1 h-px" style={{ background: 'rgba(66,71,84,0.18)' }} />
          <div className="font-mono text-[10px] text-outline tracking-[0.12em]">
            LEARN &middot; 3 MIN
          </div>
          <div className="flex-1 h-px" style={{ background: 'rgba(66,71,84,0.18)' }} />
        </div>

        {/* ============ LEARN GRID ============ */}
        <div className="grid grid-cols-3 gap-3">
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
                  className="font-mono text-xs text-primary px-1.5 py-px rounded bg-surface-container"
                  style={{ boxShadow: 'inset 0 0 0 1px rgba(66,71,84,0.18)' }}
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
