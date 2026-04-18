import { useMemo } from 'react';
import { ChevronRight, ChevronDown, FileText, Folder, FolderOpen, BookOpen } from 'lucide-react';
import { parseIvk, type HttpMethod } from 'ivkjs';
import { useCollectionStore } from '@/stores/collection-store';
import { useDocsStore } from '@/stores/docs-store';
import { useEditorStore, type TabData } from '@/stores/editor-store';
import { TOKENS, MethodBadge } from '@/components/shared/primitives';

interface TreeNode {
  name: string;
  path: string;
  type: 'folder' | 'ivk' | 'md';
  children: TreeNode[];
}

/* ------------------------------------------------------------------ */
/*  Tree builder                                                       */
/* ------------------------------------------------------------------ */
function buildUnifiedTree(
  ivkFiles: { path: string; name: string }[],
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
    const node: TreeNode = {
      name: parts[parts.length - 1]!.replace('.ivk', ''),
      path: file.path,
      type: 'ivk',
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
/*  Tree item                                                          */
/* ------------------------------------------------------------------ */
function TreeItem({ node, depth = 0, searchQuery }: { node: TreeNode; depth?: number; searchQuery?: string }) {
  const expandedFolders = useCollectionStore((s) => s.expandedFolders);
  const toggleFolder = useCollectionStore((s) => s.toggleFolder);
  const activeTabPath = useEditorStore((s) => s.activeTabPath);
  const openTab = useEditorStore((s) => s.openTab);
  const getFileByPath = useCollectionStore((s) => s.getFileByPath);

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

  const method = useMemo<HttpMethod | null>(() => {
    if (!isIvk) return null;
    const file = getFileByPath(node.path);
    if (!file) return null;
    try {
      return parseIvk(file.content).method;
    } catch {
      return null;
    }
  }, [isIvk, node.path, getFileByPath]);

  const handleClick = () => {
    if (isIvk) {
      const tab: TabData = { kind: 'ivk', path: node.path, name: node.name, method: method ?? undefined };
      openTab(tab);
      useCollectionStore.getState().setActiveFile(node.path);
    } else {
      const tab: TabData = { kind: 'folder', path: node.path, name: node.name };
      openTab(tab);
    }
  };

  return (
    <button
      onClick={handleClick}
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
/*  Exported component                                                 */
/* ------------------------------------------------------------------ */
interface UnifiedTreeProps {
  searchQuery?: string;
}

export function UnifiedTree({ searchQuery }: UnifiedTreeProps) {
  const ivkFiles = useCollectionStore((s) => s.files);
  const mdFiles = useDocsStore((s) => s.docs);
  const tree = useMemo(() => buildUnifiedTree(ivkFiles, mdFiles), [ivkFiles, mdFiles]);

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
    return (
      <div style={{ padding: '24px 12px', textAlign: 'center', color: TOKENS.fg3, fontSize: 12 }}>
        {searchQuery ? 'No matching files' : 'No files loaded'}
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 4, paddingBottom: 4 }}>
      {filteredTree.map((node) => (
        <TreeItem key={node.path} node={node} searchQuery={searchQuery} />
      ))}
    </div>
  );
}
