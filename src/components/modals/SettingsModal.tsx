import { useState, useEffect } from 'react';
import {
  X,
  Sliders,
  Palette,
  Keyboard,
} from 'lucide-react';
import { TOKENS, Kbd, Toggle, Select } from '@/components/shared/primitives';
import { useTheme } from '@/themes/theme-provider';
import { useEditorStore } from '@/stores/editor-store';

interface Props {
  onClose: () => void;
}

type SettingsPage = 'general' | 'appearance' | 'keyboard';

// Account / AI / Data & sync intentionally omitted — they were design
// stubs with no state binding, no handlers, no underlying features.
//   - Account: contradicted "no sign-in" promise (PR #23)
//   - AI: nothing AI in the app
//   - Data & sync: collections-path / history / git-sync are not wired;
//     "Reveal" had no onClick, the toggles had no onChange, the selects
//     showed hardcoded values
// Add each pane back when its backing functionality ships, with real
// store wiring and working handlers.
const PAGES: { id: SettingsPage; label: string; icon: React.ReactNode }[] = [
  { id: 'general', label: 'General', icon: <Sliders size={14} /> },
  { id: 'appearance', label: 'Appearance', icon: <Palette size={14} /> },
  { id: 'keyboard', label: 'Keyboard', icon: <Keyboard size={14} /> },
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
            // Accessible name + machine-readable id so screen readers can
            // distinguish the visually-identical gradient cards and tests
            // can target a specific theme without depending on grid order.
            aria-label={swatch.label}
            aria-pressed={currentTheme.id === swatch.id}
            data-theme-id={swatch.id}
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
  const vimMode = useEditorStore((s) => s.vimMode);
  const setVimMode = useEditorStore((s) => s.setVimMode);

  const shortcuts = [
    { action: 'Command palette', keys: ['⌘', 'K'] },
    { action: 'Send request', keys: ['⌘', '↵'] },
    { action: 'Save request', keys: ['⌘', 'S'] },
    { action: 'New request', keys: ['⌘', 'N'] },
    { action: 'Close tab', keys: ['⌘', 'W'] },
    { action: 'Next tab', keys: ['⌃', 'Tab'] },
    { action: 'Jump to request', keys: ['⌘', 'P'] },
    { action: 'Jump to env', keys: ['⌘', 'E'] },
    { action: 'Toggle sidebar', keys: ['⌘', '\\'] },
    { action: 'Format JSON', keys: ['⌘', '⇧', 'F'] },
    // "Run test suite" was listed but never wired. Removed until the
    // collection-wide test runner ships.
  ];

  return (
    <>
      <PageTitle note="View and customize keyboard shortcuts.">Keyboard</PageTitle>
      <Row label="Vim mode" hint="Use vim keybindings inside the body, scripts, and doc editors.">
        <Toggle on={vimMode} onChange={setVimMode} />
      </Row>
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


