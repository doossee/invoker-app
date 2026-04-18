import { useState, useEffect } from 'react';
import {
  X,
  Sliders,
  Palette,
  Keyboard,
  Sparkles,
  Database,
  User,
} from 'lucide-react';
import { TOKENS, Kbd, Toggle, Select } from '@/components/shared/primitives';
import { useTheme } from '@/themes/theme-provider';

interface Props {
  onClose: () => void;
}

type SettingsPage = 'general' | 'appearance' | 'keyboard' | 'ai' | 'data' | 'account';

const PAGES: { id: SettingsPage; label: string; icon: React.ReactNode }[] = [
  { id: 'general', label: 'General', icon: <Sliders size={14} /> },
  { id: 'appearance', label: 'Appearance', icon: <Palette size={14} /> },
  { id: 'keyboard', label: 'Keyboard', icon: <Keyboard size={14} /> },
  { id: 'ai', label: 'AI', icon: <Sparkles size={14} /> },
  { id: 'data', label: 'Data & sync', icon: <Database size={14} /> },
  { id: 'account', label: 'Account', icon: <User size={14} /> },
];

export function SettingsModal({ onClose }: Props) {
  const [activePage, setActivePage] = useState<SettingsPage>('general');

  // Escape key to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'radial-gradient(circle at 50% 40%, #0a0a0a 0%, #000 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Inter', system-ui, sans-serif",
        zIndex: 100,
      }}
    >
      {/* Decorative shell behind */}
      <div
        style={{
          position: 'absolute',
          inset: 24,
          borderRadius: 14,
          background: TOKENS.s1,
          opacity: 0.45,
          boxShadow: `inset 0 0 0 1px ${TOKENS.strokeSoft}`,
        }}
      />

      {/* Modal container */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: 860,
          height: 560,
          maxWidth: '94%',
          maxHeight: '90%',
          background: TOKENS.s2,
          borderRadius: 12,
          boxShadow: `0 30px 80px rgba(0,0,0,0.6), inset 0 0 0 1px ${TOKENS.stroke}`,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            height: 44,
            display: 'flex',
            alignItems: 'center',
            padding: '0 14px',
            borderBottom: `1px solid ${TOKENS.strokeSoft}`,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 600, color: TOKENS.fg1, flex: 1 }}>Settings</span>
          <Kbd>Esc</Kbd>
          <button
            onClick={onClose}
            style={{
              width: 22,
              height: 22,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              color: TOKENS.fg3,
              cursor: 'pointer',
              marginLeft: 8,
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Page rail */}
          <div
            style={{
              width: 176,
              borderRight: `1px solid ${TOKENS.strokeSoft}`,
              padding: '10px 8px',
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
            }}
          >
            {PAGES.map((page) => (
              <button
                key={page.id}
                onClick={() => setActivePage(page.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 9,
                  padding: '6px 9px',
                  borderRadius: 6,
                  border: 'none',
                  background: activePage === page.id ? TOKENS.s4 : 'transparent',
                  color: activePage === page.id ? TOKENS.fg1 : TOKENS.fg2,
                  fontFamily: 'inherit',
                  fontSize: 12,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span style={{ color: activePage === page.id ? TOKENS.amber : TOKENS.fg3, display: 'flex' }}>
                  {page.icon}
                </span>
                {page.label}
              </button>
            ))}
          </div>

          {/* Page content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px' }}>
            {activePage === 'general' && <GeneralPage />}
            {activePage === 'appearance' && <AppearancePage />}
            {activePage === 'keyboard' && <KeyboardPage />}
            {activePage === 'ai' && <AIPage />}
            {activePage === 'data' && <DataPage />}
            {activePage === 'account' && <AccountPage />}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Shared setting row                                                 */
/* ------------------------------------------------------------------ */
function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '12px 0',
        borderBottom: `1px solid ${TOKENS.strokeSoft}`,
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: TOKENS.fg1 }}>{label}</div>
        {hint && <div style={{ fontSize: 11, color: TOKENS.fg3, marginTop: 2 }}>{hint}</div>}
      </div>
      {children}
    </div>
  );
}

function PageTitle({ children, note }: { children: React.ReactNode; note?: string }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: 18, letterSpacing: '-0.01em', color: TOKENS.fg1 }}>
        {children}
      </div>
      {note && <div style={{ marginTop: 4, fontSize: 12, color: TOKENS.fg3 }}>{note}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Pages                                                              */
/* ------------------------------------------------------------------ */
function GeneralPage() {
  return (
    <>
      <PageTitle note="Configure default behavior for requests and app preferences.">General</PageTitle>
      <Row label="Default request method" hint="Method used when creating new requests">
        <Select value="GET" options={['GET', 'POST', 'PUT', 'PATCH', 'DELETE']} />
      </Row>
      <Row label="Request timeout" hint="Maximum time to wait for a response">
        <Select value="30s" options={['10s', '30s', '60s', '120s']} />
      </Row>
      <Row label="Follow redirects"><Toggle on /></Row>
      <Row label="Verify SSL certificates"><Toggle on /></Row>
      <Row label="Save history" hint="Keep a log of sent requests"><Toggle on /></Row>
      <Row label="Open last collection on launch"><Toggle on /></Row>
      <Row label="Check for updates">
        <Select value="Weekly" options={['Daily', 'Weekly', 'Monthly', 'Never']} />
      </Row>
    </>
  );
}

function AppearancePage() {
  const { theme: currentTheme, setTheme, themes: availableThemes } = useTheme();

  const themeSwatches = availableThemes.map((t) => ({
    id: t.id,
    label: t.name,
    bg: t.colors.surfaceLowest,
    fg: t.colors.onSurface,
    accent: t.colors.primary,
  }));

  return (
    <>
      <PageTitle note="Customize how the app looks.">Appearance</PageTitle>

      {/* Theme swatches */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(themeSwatches.length, 4)}, 1fr)`, gap: 10, marginBottom: 10 }}>
        {themeSwatches.map((swatch) => (
          <button
            key={swatch.id}
            onClick={() => setTheme(swatch.id)}
            style={{
              height: 72,
              borderRadius: 8,
              background: swatch.bg,
              boxShadow: currentTheme.id === swatch.id
                ? `inset 0 0 0 1px ${TOKENS.amber}, 0 0 0 2px rgba(230,193,136,0.2)`
                : `inset 0 0 0 1px ${TOKENS.strokeSoft}`,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <div style={{ display: 'flex', gap: 3 }}>
              <div style={{ width: 20, height: 3, borderRadius: 2, background: swatch.accent }} />
              <div style={{ width: 14, height: 3, borderRadius: 2, background: swatch.fg, opacity: 0.3 }} />
            </div>
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        {themeSwatches.map((swatch) => (
          <div key={swatch.id} style={{ flex: 1, textAlign: 'center', fontSize: 11, fontWeight: 500, color: currentTheme.id === swatch.id ? TOKENS.amber : TOKENS.fg2 }}>
            {swatch.label}
          </div>
        ))}
      </div>

      <Row label="Reduce motion"><Toggle /></Row>
    </>
  );
}

function KeyboardPage() {
  const shortcuts = [
    { action: 'Command palette', keys: ['⌘', 'K'] },
    { action: 'Send request', keys: ['⌘', '↵'] },
    { action: 'New request', keys: ['⌘', 'N'] },
    { action: 'Close tab', keys: ['⌘', 'W'] },
    { action: 'Next tab', keys: ['⌃', 'Tab'] },
    { action: 'Jump to request', keys: ['⌘', 'P'] },
    { action: 'Jump to env', keys: ['⌘', 'E'] },
    { action: 'Toggle sidebar', keys: ['⌘', '\\'] },
    { action: 'Find in response', keys: ['⌘', 'F'] },
    { action: 'Run test suite', keys: ['⌘', '⇧', 'T'] },
  ];

  return (
    <>
      <PageTitle note="View and customize keyboard shortcuts.">Keyboard</PageTitle>
      {shortcuts.map((s) => (
        <Row key={s.action} label={s.action}>
          <div style={{ display: 'flex', gap: 3 }}>
            {s.keys.map((k, i) => (
              <Kbd key={i}>{k}</Kbd>
            ))}
          </div>
        </Row>
      ))}
    </>
  );
}

function AIPage() {
  return (
    <>
      <PageTitle note="Configure AI-powered features.">AI</PageTitle>
      <Row label="Enable AI features"><Toggle on /></Row>
      <Row label="Provider"><Select value="Anthropic" /></Row>
      <Row label="Model"><Select value="claude-haiku-4-5" /></Row>
      <div
        style={{
          marginTop: 18,
          padding: 12,
          borderRadius: 8,
          background: TOKENS.s3,
          boxShadow: `inset 0 0 0 1px ${TOKENS.strokeSoft}`,
          display: 'flex',
          gap: 10,
        }}
      >
        <Sparkles size={14} style={{ color: TOKENS.amber, flexShrink: 0, marginTop: 2 }} />
        <span style={{ fontSize: 12, color: TOKENS.fg2, lineHeight: 1.5 }}>
          AI features run locally and never send your API keys or request data to third-party services.
        </span>
      </div>
    </>
  );
}

function DataPage() {
  return (
    <>
      <PageTitle note="Manage your data, history, and sync preferences.">Data & Sync</PageTitle>
      <Row label="Collections path" hint="Where your .ivk files are stored">
        <button
          style={{
            padding: '5px 10px',
            background: TOKENS.s3,
            border: 'none',
            borderRadius: 6,
            boxShadow: `inset 0 0 0 1px ${TOKENS.stroke}`,
            color: TOKENS.fg2,
            fontSize: 11,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Reveal...
        </button>
      </Row>
      <Row label="Keep history for"><Select value="90 days" options={['30 days', '90 days', '1 year', 'Forever']} /></Row>
      <Row label="Redact secrets from history"><Toggle on /></Row>
      <Row label="Sync via Git"><Toggle on /></Row>
    </>
  );
}

function AccountPage() {
  return (
    <>
      <PageTitle>Account</PageTitle>
      {/* Profile card */}
      <div
        style={{
          padding: 14,
          borderRadius: 10,
          background: TOKENS.s3,
          boxShadow: `inset 0 0 0 1px ${TOKENS.strokeSoft}`,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 18,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${TOKENS.amber}, ${TOKENS.red})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0a0a0a',
            fontWeight: 700,
            fontSize: 14,
            flexShrink: 0,
          }}
        >
          d
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: TOKENS.fg1 }}>doossee</div>
          <div style={{ fontSize: 11, color: TOKENS.fg3 }}>ovidevtool@outlook.com · Personal plan</div>
        </div>
        <button
          style={{
            padding: '5px 10px',
            background: TOKENS.s3,
            border: 'none',
            borderRadius: 6,
            boxShadow: `inset 0 0 0 1px ${TOKENS.stroke}`,
            color: TOKENS.fg2,
            fontSize: 11,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Manage
        </button>
      </div>
      <Row label="Team workspace">
        <button
          style={{
            padding: '5px 10px',
            background: TOKENS.s3,
            border: 'none',
            borderRadius: 6,
            boxShadow: `inset 0 0 0 1px ${TOKENS.stroke}`,
            color: TOKENS.fg2,
            fontSize: 11,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Create...
        </button>
      </Row>
      <Row label="Sign out">
        <button
          style={{
            padding: '5px 10px',
            background: 'transparent',
            border: 'none',
            color: TOKENS.red,
            fontSize: 12,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Sign out
        </button>
      </Row>
    </>
  );
}
