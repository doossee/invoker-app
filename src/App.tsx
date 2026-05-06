import { useState, useEffect } from 'react';
import { PanelLeft } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { ResizablePanel } from '@/components/layout/ResizablePanel';
import { UnifiedTree } from '@/components/collection/UnifiedTree';
import { WelcomePage } from '@/components/welcome/WelcomePage';
import { CollectionDashboard } from '@/components/welcome/CollectionDashboard';
import { RequestEditor } from '@/components/editor/RequestEditor';
import { FolderTabBody } from '@/components/editor/FolderTabBody';
import { DocTabBody } from '@/components/editor/DocTabBody';
import { EditorTabs } from '@/components/editor/EditorTabs';
import { EnvSettings } from '@/components/env/EnvSettings';
import { CommandPalette } from '@/components/modals/CommandPalette';
import { SettingsModal } from '@/components/modals/SettingsModal';
import { useEditorStore } from '@/stores/editor-store';
import { useCollectionStore } from '@/stores/collection-store';
import { useEnvStore } from '@/stores/env-store';
import { watchCollection, loadCollection, loadFromManifest } from '@/lib/file-system';
import { isPublished, isTauri } from '@/lib/platform';
import { sampleCollection } from '@/data/sample-collection';
import { sampleDocs } from '@/data/sample-docs';
import { matchShortcut } from '@/lib/shortcuts';
import { nextTabPath } from '@/lib/cycle-tab';
import { useDocsStore } from '@/stores/docs-store';
import { TOKENS } from '@/components/shared/primitives';

export function App() {
  const [searchQuery, setSearchQuery] = useState('');

  const sidebarWidth = useEditorStore((s) => s.sidebarWidth);
  const setSidebarWidth = useEditorStore((s) => s.setSidebarWidth);
  const sidebarCollapsed = useEditorStore((s) => s.sidebarCollapsed);
  const setSidebarCollapsed = useEditorStore((s) => s.setSidebarCollapsed);
  const toggleSidebar = useEditorStore((s) => s.toggleSidebar);
  const createInlineTab = useEditorStore((s) => s.createInlineTab);
  const setSiteConfig = useEditorStore((s) => s.setSiteConfig);

  // Tab state
  const tabs = useEditorStore((s) => s.tabs);
  const activeTabPath = useEditorStore((s) => s.activeTabPath);
  const activeTab = tabs.find((t) => t.path === activeTabPath);

  // Modal state
  const settingsOpen = useEditorStore((s) => s.settingsOpen);
  const setSettingsOpen = useEditorStore((s) => s.setSettingsOpen);
  const envSettingsOpen = useEditorStore((s) => s.envSettingsOpen);
  const setEnvSettingsOpen = useEditorStore((s) => s.setEnvSettingsOpen);
  const commandPaletteOpen = useEditorStore((s) => s.commandPaletteOpen);
  const setCommandPaletteOpen = useEditorStore((s) => s.setCommandPaletteOpen);

  const collectionPath = useCollectionStore((s) => s.collectionPath);
  const collectionFiles = useCollectionStore((s) => s.files);
  const collectionDocs = useDocsStore((s) => s.docs);
  // A collection is considered loaded once any request OR doc has arrived
  // (via Tauri / FSA / manifest / sample). Empty arrays mean first-run state.
  const collectionLoaded = collectionFiles.length > 0 || collectionDocs.length > 0;

  // Global keyboard shortcuts.
  //
  // Uses matchShortcut() which keys on `e.code` (physical key) instead of
  // `e.key` (character). This is critical for non-Latin keyboard layouts —
  // a Cyrillic user pressing the K key gives `e.key = 'л'` but `e.code = 'KeyK'`,
  // and the previous `e.key === 'k'` check missed all of them. matchShortcut
  // also fixes the pre-existing ⌘⇧F bug where `e.key === 'f' && e.shiftKey`
  // could never both be true (shift+F → `e.key === 'F'`).
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // ⌘K — Command palette. ⌘P is also bound here as a quick-open alias
      // (VSCode/Cursor convention), since Settings → Keyboard advertises
      // it as "Jump to request" and the palette already filters by request
      // by default.
      if (
        matchShortcut(e, 'KeyK', { shift: false }) ||
        matchShortcut(e, 'KeyP', { shift: false })
      ) {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
        return;
      }

      // ⌘Enter — Send request
      if (matchShortcut(e, 'Enter')) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('invoker:send'));
        return;
      }

      // ⌘N — New request (create an untitled inline request tab)
      if (matchShortcut(e, 'KeyN', { shift: false })) {
        e.preventDefault();
        createInlineTab();
        return;
      }

      // ⌘W — Close tab. Confirm before discarding unsaved edits — the
      // tab's `dirty` flag is set by every field-change handler (see
      // RequestEditor.touch) and cleared by Save. We use the native
      // window.confirm to avoid building a custom modal for a single
      // edge case; the prompt is short enough that users won't fight it.
      if (matchShortcut(e, 'KeyW', { shift: false })) {
        e.preventDefault();
        if (activeTabPath) {
          const tab = useEditorStore.getState().tabs.find((t) => t.path === activeTabPath);
          if (tab?.dirty) {
            const ok = window.confirm(
              `${tab.name} has unsaved changes. Close anyway?`,
            );
            if (!ok) return;
          }
          useEditorStore.getState().closeTab(activeTabPath);
        }
        return;
      }

      // ⌘S — Save active request. RequestEditor listens for this event and
      // serializes+persists its current state via collection-store.saveRequest.
      if (matchShortcut(e, 'KeyS', { shift: false })) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('invoker:save'));
        return;
      }

      // ⌘E — Switch environment
      if (matchShortcut(e, 'KeyE', { shift: false })) {
        e.preventDefault();
        const state = useEnvStore.getState();
        const envs = state.settings.environments;
        if (envs.length > 0) {
          const next = (state.settings.activeEnvironmentIndex + 1) % envs.length;
          state.setActiveEnv(next);
        }
        return;
      }

      // ⌘⇧F — Format JSON
      if (matchShortcut(e, 'KeyF', { shift: true })) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('invoker:format-json'));
        return;
      }

      // ⌘\ — Toggle sidebar
      if (matchShortcut(e, 'Backslash', { shift: false })) {
        e.preventDefault();
        toggleSidebar();
        return;
      }

      // ⌃Tab / ⌃⇧Tab — Cycle editor tabs. Explicitly checks `ctrlKey
      // && !metaKey` (NOT matchShortcut, which treats Cmd/Ctrl as
      // equivalent) — on macOS Cmd+Tab is the system app switcher and
      // we don't want to intercept it. Matches the tab-cycling
      // convention used by every IDE / browser. Settings → Keyboard
      // listed this as `⌃Tab "Next tab"` for a while but no handler
      // was wired (#61 fixes that).
      if (e.code === 'Tab' && e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        const state = useEditorStore.getState();
        const next = nextTabPath({
          tabs: state.tabs,
          currentPath: state.activeTabPath,
          shift: e.shiftKey,
        });
        if (next) state.setActiveTab(next);
        return;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeTabPath, commandPaletteOpen, setCommandPaletteOpen, createInlineTab, toggleSidebar]);

  // Auto-collapse sidebar on narrow viewports (mobile-responsive fallback).
  // Restores it when viewport widens again — but ONLY if the most recent
  // collapse was triggered by us (auto), not by the user clicking the
  // collapse button. The previous implementation tracked `userCollapsed`
  // but never set it to `true` on a manual click, so any manual collapse
  // got auto-restored on the next viewport-widen event. Tracking via
  // a store subscription here distinguishes auto-collapse (we set the
  // flag) from manual collapse (the flag stays clear).
  useEffect(() => {
    const MOBILE_BREAKPOINT = 720;
    let lastWasAuto = false;
    let resizeJustFired = false;
    let prevCollapsed = useEditorStore.getState().sidebarCollapsed;

    const unsubscribe = useEditorStore.subscribe((state) => {
      const collapsed = state.sidebarCollapsed;
      if (collapsed !== prevCollapsed) {
        // Any change we DIDN'T just trigger via onResize is manual.
        if (!resizeJustFired) lastWasAuto = false;
        prevCollapsed = collapsed;
      }
    });

    const onResize = () => {
      const narrow = window.innerWidth < MOBILE_BREAKPOINT;
      const current = useEditorStore.getState().sidebarCollapsed;
      if (narrow && !current) {
        resizeJustFired = true;
        lastWasAuto = true;
        setSidebarCollapsed(true);
        queueMicrotask(() => {
          resizeJustFired = false;
        });
      } else if (!narrow && current && lastWasAuto) {
        resizeJustFired = true;
        lastWasAuto = false;
        setSidebarCollapsed(false);
        queueMicrotask(() => {
          resizeJustFired = false;
        });
      }
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      unsubscribe();
    };
  }, [setSidebarCollapsed]);

  // Published mode: load manifest at startup
  useEffect(() => {
    if (!isPublished()) return;

    loadFromManifest().then((data) => {
      useCollectionStore.getState().loadCollection({
        ivkFiles: data.ivkFiles,
        basePath: data.basePath,
      });
      useDocsStore.getState().loadDocs(data.mdFiles);

      if (data.config?.defaults) {
        useEnvStore.getState().setAuthorDefaults(data.config.defaults);
      }
      setSiteConfig(data.config ?? null);
    });
  }, [setSiteConfig]);

  // Auto-open last collection at startup. Honors the General → "Open last
  // collection on launch" toggle (default ON). Skips published mode (the
  // manifest effect above already handles it). Skips if a collection is
  // already loaded (Strict Mode double-mount or HMR re-run).
  useEffect(() => {
    if (isPublished()) return;
    if (!useEditorStore.getState().openLastOnLaunch) return;
    if (useCollectionStore.getState().files.length > 0) return;

    const lastPath = localStorage.getItem('invoker:last-collection-path');
    if (!lastPath) return;

    if (lastPath === '(sample)') {
      useCollectionStore.getState().loadCollection({
        ivkFiles: sampleCollection,
        basePath: '(sample)',
      });
      useCollectionStore.getState().setCollectionPath('(sample)');
      useDocsStore.getState().loadDocs(sampleDocs);
      return;
    }

    // Real folder path → only Tauri can re-open without a fresh user-
    // gesture pick. The browser File System Access API requires
    // re-prompting on every load.
    if (!isTauri()) return;
    loadCollection(lastPath)
      .then((data) => {
        useCollectionStore.getState().loadCollection({
          ivkFiles: data.ivkFiles,
          basePath: data.basePath,
        });
        useCollectionStore.getState().setCollectionPath(lastPath);
        useDocsStore.getState().loadDocs(data.mdFiles);
      })
      .catch((e) => {
        // Folder may have been moved/deleted since the last session — log
        // and clear the stale path so the user gets the welcome screen
        // instead of an error loop.
        console.warn('[invoker] auto-open last collection failed:', e);
        localStorage.removeItem('invoker:last-collection-path');
      });
  }, []);

  // Watch collection for changes
  useEffect(() => {
    if (!collectionPath) return;
    const unwatch = watchCollection(collectionPath, async () => {
      const data = await loadCollection(collectionPath);
      useCollectionStore.getState().loadCollection({ ivkFiles: data.ivkFiles, basePath: data.basePath });
      useDocsStore.getState().loadDocs(data.mdFiles);
    });
    return unwatch;
  }, [collectionPath]);

  // Drop tabs whose paths no longer exist in the loaded collection.
  // Fires on every collection swap (sample → real folder, folder A →
  // folder B, etc.) so stale tabs from the previous collection don't
  // hang around showing empty editor surfaces. Inline tabs (untitled
  // requests) are preserved — they live only in memory anyway.
  // The purgeStaleTabs action is a no-op fast-path when nothing
  // needs dropping, so this also runs harmlessly on file
  // additions/removals within a single collection.
  useEffect(() => {
    const valid = new Set<string>();
    for (const f of collectionFiles) valid.add(f.path);
    for (const d of collectionDocs) {
      valid.add(d.path);
      // Folder tabs reference the FOLDER path (e.g. `playground`),
      // not the README's `playground/README.md`. Fold the parent
      // directory in so a folder tab survives if its README is in
      // the new collection.
      const lower = d.path.toLowerCase();
      if (lower.endsWith('/readme.md')) {
        valid.add(d.path.slice(0, -'/README.md'.length));
      }
    }
    useEditorStore.getState().purgeStaleTabs(valid);
  }, [collectionFiles, collectionDocs]);

  // Determine content view
  const hasActiveTab = !!activeTab;
  const showIvk = activeTab?.kind === 'ivk';
  const showFolder = activeTab?.kind === 'folder';
  const showDoc = activeTab?.kind === 'doc';

  // Sync activeFilePath with collection store for backward compat
  useEffect(() => {
    if (showIvk && activeTab?.path) {
      const currentActive = useCollectionStore.getState().activeFilePath;
      if (currentActive !== activeTab.path) {
        useCollectionStore.getState().setActiveFile(activeTab.path);
      }
    }
  }, [showIvk, activeTab?.path]);

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        gap: 12,
        padding: 12,
        background: TOKENS.s1,
        color: TOKENS.fg1,
        fontFamily: "'Inter', system-ui, sans-serif",
        overflow: 'hidden',
      }}
    >
      {/* Sidebar */}
      {!sidebarCollapsed && (
        <div style={{ flexShrink: 0, height: '100%' }}>
          <ResizablePanel width={sidebarWidth} onWidthChange={setSidebarWidth}>
            <Sidebar
              onOpenSettings={() => setSettingsOpen(true)}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            >
              <UnifiedTree searchQuery={searchQuery} />
            </Sidebar>
          </ResizablePanel>
        </div>
      )}

      {/* Main content area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          gap: 10,
          position: 'relative',
        }}
      >
        {/* Sidebar re-open button when collapsed */}
        {sidebarCollapsed && (
          <button
            onClick={() => setSidebarCollapsed(false)}
            title="Show sidebar (⌘\\)"
            style={{
              position: 'absolute',
              top: 8,
              left: 8,
              zIndex: 10,
              width: 30,
              height: 30,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: TOKENS.s2,
              border: 'none',
              borderRadius: 7,
              color: TOKENS.fg2,
              cursor: 'pointer',
              boxShadow: `inset 0 0 0 1px ${TOKENS.stroke}`,
            }}
          >
            <PanelLeft size={14} />
          </button>
        )}

        {/* Editor tabs row — always visible when tabs exist */}
        {tabs.length > 0 && <EditorTabs />}

        {/* Content body */}
        {!hasActiveTab && !collectionLoaded && <WelcomePage />}
        {!hasActiveTab && collectionLoaded && <CollectionDashboard />}
        {showIvk && activeTab && <RequestEditor filePath={activeTab.path} />}
        {showFolder && activeTab && <FolderTabBody folderPath={activeTab.path} />}
        {showDoc && activeTab && <DocTabBody docPath={activeTab.path} />}
      </div>

      {/* Modals */}
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
      {envSettingsOpen && <EnvSettings onClose={() => setEnvSettingsOpen(false)} />}
      {commandPaletteOpen && <CommandPalette onClose={() => setCommandPaletteOpen(false)} />}
    </div>
  );
}
