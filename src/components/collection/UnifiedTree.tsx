import { useEffect, useMemo, useState, createContext, useContext } from 'react';
import { ChevronRight, ChevronDown, FileText, Folder, FolderOpen, BookOpen, Sparkles, Pencil, Trash2 } from 'lucide-react';
import { parseIvk, type HttpMethod } from 'ivkjs';
import { useCollectionStore } from '@/stores/collection-store';
import { useDocsStore } from '@/stores/docs-store';
import { useEditorStore, type TabData } from '@/stores/editor-store';
import { useOpenCollection } from '@/hooks/useOpenCollection';
import { TOKENS, MethodBadge } from '@/components/shared/primitives';

interface TreeNode {
  name: string;
  path: string;
  type: 'folder' | 'ivk' | 'md';
  /** Parsed method for ivk nodes — baked at tree-build time so saves
   * propagate to the sidebar badges without per-item parsing/subscriptions. */
  method?: HttpMethod;
  children: TreeNode[];
}

/* ------------------------------------------------------------------ */
/*  Tree builder                                                       */
/* ------------------------------------------------------------------ */
function buildUnifiedTree(
  ivkFiles: { path: string; name: string; content: string }[],
  mdFiles: { path: string; title: string }[],
): TreeNode[] {
  const root: TreeNode[] = [];
  const folderMap = new Map<string, TreeNode>();

  function ensureFolder(folderPath: string): TreeNode {
    if (folderMap.has(folderPath)) return folderMap.get(folderPath)!;
    const parts = folderPath.split('/');
    const node: TreeNode = {
      name: parts[parts.length - 1]!,
      path: folderPath,
      type: 'folder',
      children: [],
    };
    folderMap.set(folderPath, node);

    if (parts.length > 1) {
      const parentPath = parts.slice(0, -1).join('/');
      const parent = ensureFolder(parentPath);
      if (!parent.children.some((c) => c.path === folderPath)) {
        parent.children.push(node);
      }
    } else {
      if (!root.some((c) => c.path === folderPath)) root.push(node);
    }
    return node;
  }

  for (const file of ivkFiles) {
    const parts = file.path.split('/');
    let method: HttpMethod | undefined;
    try {
      method = parseIvk(file.content).method;
    } catch {
      /* leave method undefined; icon fallback renders a file glyph */
    }
    const node: TreeNode = {
      name: parts[parts.length - 1]!.replace('.ivk', ''),
      path: file.path,
      type: 'ivk',
      method,
      children: [],
    };
    if (parts.length > 1) {
      ensureFolder(parts.slice(0, -1).join('/')).children.push(node);
    } else {
      root.push(node);
    }
  }

  for (const doc of mdFiles) {
    const lower = doc.path.toLowerCase();
    if (lower.endsWith('/readme.md') || lower === 'readme.md') continue;
    const parts = doc.path.split('/');
    const node: TreeNode = {
      name: parts[parts.length - 1]!.replace('.md', ''),
      path: doc.path,
      type: 'md',
      children: [],
    };
    if (parts.length > 1) {
      ensureFolder(parts.slice(0, -1).join('/')).children.push(node);
    } else {
      root.push(node);
    }
  }

  function sortChildren(nodes: TreeNode[]) {
    nodes.sort((a, b) => {
      const af = a.type === 'folder' ? 0 : 1;
      const bf = b.type === 'folder' ? 0 : 1;
      if (af !== bf) return af - bf;
      return a.name.localeCompare(b.name);
    });
    for (const n of nodes) {
      if (n.type === 'folder') sortChildren(n.children);
    }
  }
  sortChildren(root);
  return root;
}

function countFiles(node: TreeNode): number {
  if (node.type !== 'folder') return 1;
  return node.children.reduce((c, n) => c + countFiles(n), 0);
}

/* ------------------------------------------------------------------ */
/*  Context menu — right-click on a tree item                          */
/*                                                                      */
/*  Browser-mode in-memory only. Tauri integration (rename/delete on    */
/*  disk via @tauri-apps/plugin-fs) is a follow-up.                     */
/* ------------------------------------------------------------------ */
type CtxMenuState = { x: number; y: number; path: string; isIvk: boolean } | null;
const CtxMenuContext = createContext<{ open: (s: CtxMenuState) => void } | null>(null);

function ContextMenu({ state, onClose }: { state: CtxMenuState; onClose: () => void }) {
  const closeTab = useEditorStore((s) => s.closeTab);
  const tabs = useEditorStore((s) => s.tabs);
  const renameFile = useCollectionStore((s) => s.renameFile);
  const deleteFile = useCollectionStore((s) => s.deleteFile);

  // Click-outside / Escape to dismiss.
  useEffect(() => {
    if (!state) return;
    const onClickOutside = (e: MouseEvent) => {
      // Use `click` (not `mousedown`) so the right-click that OPENED
      // the menu (which fires its own mousedown) doesn't immediately
      // dismiss it. The follow-up click on a menuitem stops propagation
      // via React's onClick handler — and a click anywhere else on the
      // page closes the menu.
      const target = e.target as Node;
      const menuRoot = (e.currentTarget as Document).querySelector('[data-ctx-menu-root]');
      if (menuRoot && menuRoot.contains(target)) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('click', onClickOutside);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onClickOutside);
      window.removeEventListener('keydown', onKey);
    };
  }, [state, onClose]);

  if (!state) return null;

  const handleRename = async () => {
    onClose();
    const current = state.path.split('/').pop()?.replace('.ivk', '') ?? state.path;
    // eslint-disable-next-line no-alert
    const next = window.prompt(`Rename "${current}" to:`, current);
    if (!next || next.trim() === '' || next === current) return;
    let newPath: string | null;
    try {
      newPath = await renameFile(state.path, next.trim());
    } catch (err) {
      // Disk-side failure (Tauri only — browser path can't throw). Surface
      // the message so the user knows why the rename didn't take.
      // eslint-disable-next-line no-alert
      window.alert(`Rename failed: ${err instanceof Error ? err.message : String(err)}`);
      return;
    }
    if (newPath === null) {
      // eslint-disable-next-line no-alert
      window.alert(`Cannot rename — a file at "${next.trim()}.ivk" already exists.`);
      return;
    }
    // Patch any open tab referencing the old path so the editor doesn't
    // lose its mount.
    const openTab = tabs.find((t) => t.path === state.path);
    if (openTab) {
      // The tab record's path is what RequestEditor reads from
      // getFileByPath; closing + re-opening is the simplest way to
      // refresh without adding a renameTab action.
      closeTab(state.path);
      useEditorStore.getState().openTab({ ...openTab, path: newPath });
    }
  };

  const handleDelete = async () => {
    if (!state) return;
    const path = state.path;
    onClose();
    const name = path.split('/').pop() ?? path;
    // eslint-disable-next-line no-alert
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    closeTab(path);
    try {
      await deleteFile(path);
    } catch (err) {
      // Disk-side failure (Tauri only). Surface the message.
      // eslint-disable-next-line no-alert
      window.alert(`Delete failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Keep the menu inside the viewport in case the click landed near an edge.
  const x = Math.min(state.x, window.innerWidth - 180);
  const y = Math.min(state.y, window.innerHeight - 80);

  return (
    <div
      role="menu"
      aria-label="File actions"
      data-ctx-menu-root="true"
      style={{
        position: 'fixed',
        left: x,
        top: y,
        zIndex: 1000,
        minWidth: 160,
        background: TOKENS.s2,
        borderRadius: 8,
        boxShadow: `inset 0 0 0 1px ${TOKENS.stroke}, 0 8px 24px rgba(0,0,0,0.4)`,
        padding: 4,
        fontFamily: 'inherit',
        fontSize: 12,
      }}
    >
      <button
        role="menuitem"
        onClick={handleRename}
        disabled={!state.isIvk}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          width: '100%',
          padding: '6px 10px',
          background: 'transparent',
          border: 'none',
          color: state.isIvk ? TOKENS.fg1 : TOKENS.fg4,
          cursor: state.isIvk ? 'pointer' : 'not-allowed',
          fontFamily: 'inherit',
          fontSize: 12,
          textAlign: 'left' as const,
          borderRadius: 4,
        }}
        onMouseEnter={(e) => state.isIvk && (e.currentTarget.style.background = TOKENS.s3)}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        <Pencil size={11} />
        Rename
      </button>
      <button
        role="menuitem"
        onClick={handleDelete}
        disabled={!state.isIvk}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          width: '100%',
          padding: '6px 10px',
          background: 'transparent',
          border: 'none',
          color: state.isIvk ? '#e58484' : TOKENS.fg4,
          cursor: state.isIvk ? 'pointer' : 'not-allowed',
          fontFamily: 'inherit',
          fontSize: 12,
          textAlign: 'left' as const,
          borderRadius: 4,
        }}
        onMouseEnter={(e) => state.isIvk && (e.currentTarget.style.background = 'rgba(229,88,88,0.10)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        <Trash2 size={11} />
        Delete
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tree item                                                          */
/* ------------------------------------------------------------------ */
function TreeItem({ node, depth = 0, searchQuery }: { node: TreeNode; depth?: number; searchQuery?: string }) {
  const expandedFolders = useCollectionStore((s) => s.expandedFolders);
  const toggleFolder = useCollectionStore((s) => s.toggleFolder);
  const activeTabPath = useEditorStore((s) => s.activeTabPath);
  const openTab = useEditorStore((s) => s.openTab);

  const pl = 10 + depth * 14;

  if (node.type === 'folder') {
    const isExpanded = expandedFolders.has(node.path);
    const fileCount = countFiles(node);
    const docs = useDocsStore.getState().docs;
    const hasReadme = docs.some((d) => d.path.toLowerCase() === `${node.path}/readme.md`.toLowerCase());
    const isActive = activeTabPath === node.path;

    const handleClick = () => {
      toggleFolder(node.path);
      // Open folder README as a tab
      if (hasReadme) {
        const tab: TabData = {
          kind: 'folder',
          path: node.path,
          name: node.name,
          hasReadme: true,
        };
        openTab(tab);
      }
    };

    return (
      <div>
        <button
          onClick={handleClick}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            paddingLeft: pl,
            paddingRight: 10,
            paddingTop: 5,
            paddingBottom: 5,
            background: isActive ? TOKENS.s5 : 'transparent',
            color: isActive ? TOKENS.amber : TOKENS.fg2,
            fontSize: 12,
            border: 'none',
            cursor: 'pointer',
            borderRadius: 0,
            transition: 'background 0.12s, color 0.12s',
            position: 'relative',
            fontFamily: 'inherit',
            textAlign: 'left',
          }}
        >
          {isActive && (
            <span
              style={{
                position: 'absolute',
                left: 0,
                top: 4,
                bottom: 4,
                width: 2,
                borderRadius: 2,
                background: TOKENS.amber,
              }}
            />
          )}
          {isExpanded ? (
            <ChevronDown size={10} style={{ color: TOKENS.fg3, flexShrink: 0 }} />
          ) : (
            <ChevronRight size={10} style={{ color: TOKENS.fg3, flexShrink: 0 }} />
          )}
          {isExpanded ? (
            <FolderOpen size={12} style={{ color: TOKENS.yellow, flexShrink: 0 }} />
          ) : (
            <Folder size={12} style={{ color: TOKENS.yellow, flexShrink: 0 }} />
          )}
          <span style={{ flex: 1, textAlign: 'left', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {node.name}
          </span>
          {hasReadme && (
            <BookOpen
              size={10}
              style={{
                color: isActive ? TOKENS.amber : 'rgba(118,117,117,0.55)',
                flexShrink: 0,
              }}
            />
          )}
          <span style={{ fontSize: 10, color: 'rgba(118,117,117,0.5)', flexShrink: 0 }}>
            {fileCount}
          </span>
        </button>
        {isExpanded &&
          node.children.map((child) => (
            <TreeItem key={child.path} node={child} depth={depth + 1} searchQuery={searchQuery} />
          ))}
      </div>
    );
  }

  // File node
  const isIvk = node.type === 'ivk';
  const isActive = activeTabPath === node.path;
  const method = node.method ?? null;

  const handleClick = () => {
    if (isIvk) {
      const tab: TabData = { kind: 'ivk', path: node.path, name: node.name, method: method ?? undefined };
      openTab(tab);
      useCollectionStore.getState().setActiveFile(node.path);
    } else {
      // Loose .md docs render as standalone doc tabs (not as FolderTabBody).
      const tab: TabData = { kind: 'doc', path: node.path, name: node.name };
      openTab(tab);
    }
  };

  const ctxMenu = useContext(CtxMenuContext);

  return (
    <button
      onClick={handleClick}
      onContextMenu={(e) => {
        // Right-click — only opens the menu for ivk files. Folders + .md
        // docs aren't supported by the in-memory rename/delete actions
        // yet (tracked in BUGS.md as a follow-up).
        if (!isIvk || !ctxMenu) return;
        e.preventDefault();
        ctxMenu.open({ x: e.clientX, y: e.clientY, path: node.path, isIvk: true });
      }}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        paddingLeft: pl + 16,
        paddingRight: 10,
        paddingTop: 5,
        paddingBottom: 5,
        background: isActive ? TOKENS.s5 : 'transparent',
        color: isActive ? TOKENS.amber : TOKENS.fg2,
        fontSize: 12,
        border: 'none',
        cursor: 'pointer',
        borderRadius: 0,
        transition: 'background 0.12s, color 0.12s',
        position: 'relative',
        fontFamily: 'inherit',
        textAlign: 'left',
      }}
    >
      {isActive && (
        <span
          style={{
            position: 'absolute',
            left: 0,
            top: 4,
            bottom: 4,
            width: 2,
            borderRadius: 2,
            background: TOKENS.amber,
          }}
        />
      )}
      {isIvk && method ? (
        <MethodBadge method={method} compact />
      ) : (
        <FileText size={11} style={{ color: 'rgba(96,165,250,0.75)', flexShrink: 0 }} />
      )}
      <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {node.name}
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Empty state                                                        */
/* ------------------------------------------------------------------ */
function EmptyCollectionPrompt() {
  const { openCollection, loadSample, canOpenFolder, loading } = useOpenCollection();
  return (
    <div style={{ padding: '20px 12px', textAlign: 'center' }}>
      <FolderOpen size={20} style={{ color: TOKENS.fg4, margin: '0 auto 8px' }} />
      <div style={{ fontSize: 12, color: TOKENS.fg2, marginBottom: 4 }}>No collection loaded</div>
      <div style={{ fontSize: 11, color: TOKENS.fg3, marginBottom: 12, lineHeight: 1.5 }}>
        Open a folder of <code style={{ fontFamily: "'JetBrains Mono', monospace", color: TOKENS.amber }}>.ivk</code> and <code style={{ fontFamily: "'JetBrains Mono', monospace", color: TOKENS.amber }}>.md</code> files to get started.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <button
          onClick={openCollection}
          disabled={loading || !canOpenFolder}
          title={canOpenFolder ? 'Open a folder' : 'Folder picker unavailable in this browser'}
          style={{
            padding: '5px 10px',
            background: TOKENS.amber,
            color: 'var(--ivk-on-primary)',
            border: 'none',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 600,
            cursor: canOpenFolder ? 'pointer' : 'not-allowed',
            opacity: canOpenFolder ? 1 : 0.5,
            fontFamily: 'inherit',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
          }}
        >
          <FolderOpen size={11} />
          Open folder
        </button>
        <button
          onClick={loadSample}
          style={{
            padding: '5px 10px',
            background: 'transparent',
            color: TOKENS.fg2,
            border: 'none',
            borderRadius: 6,
            boxShadow: `inset 0 0 0 1px ${TOKENS.strokeSoft}`,
            fontSize: 11,
            cursor: 'pointer',
            fontFamily: 'inherit',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
          }}
        >
          <Sparkles size={11} />
          Try sample
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Exported component                                                 */
/* ------------------------------------------------------------------ */
interface UnifiedTreeProps {
  searchQuery?: string;
}

export function UnifiedTree({ searchQuery }: UnifiedTreeProps) {
  const ivkFiles = useCollectionStore((s) => s.files);
  const mdFiles = useDocsStore((s) => s.docs);
  const tree = useMemo(() => buildUnifiedTree(ivkFiles, mdFiles), [ivkFiles, mdFiles]);
  const [ctxMenu, setCtxMenu] = useState<CtxMenuState>(null);

  // Filter tree based on search
  const filteredTree = useMemo(() => {
    if (!searchQuery?.trim()) return tree;
    const q = searchQuery.toLowerCase();
    function filterNode(node: TreeNode): TreeNode | null {
      if (node.type === 'folder') {
        const filteredChildren = node.children.map(filterNode).filter(Boolean) as TreeNode[];
        if (filteredChildren.length > 0) return { ...node, children: filteredChildren };
        if (node.name.toLowerCase().includes(q)) return node;
        return null;
      }
      return node.name.toLowerCase().includes(q) ? node : null;
    }
    return tree.map(filterNode).filter(Boolean) as TreeNode[];
  }, [tree, searchQuery]);

  if (filteredTree.length === 0) {
    if (searchQuery) {
      return (
        <div style={{ padding: '24px 12px', textAlign: 'center', color: TOKENS.fg3, fontSize: 12 }}>
          No matching files
        </div>
      );
    }
    return <EmptyCollectionPrompt />;
  }

  return (
    <CtxMenuContext.Provider value={{ open: setCtxMenu }}>
      <div style={{ paddingTop: 4, paddingBottom: 4 }}>
        {filteredTree.map((node) => (
          <TreeItem key={node.path} node={node} searchQuery={searchQuery} />
        ))}
      </div>
      <ContextMenu state={ctxMenu} onClose={() => setCtxMenu(null)} />
    </CtxMenuContext.Provider>
  );
}
