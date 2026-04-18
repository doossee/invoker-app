import { useMemo } from 'react';
import { ChevronRight, ChevronDown, Zap, FileText, Folder, FolderOpen } from 'lucide-react';
import { parseIvk, type HttpMethod } from 'ivkjs';
import { useCollectionStore } from '@/stores/collection-store';
import { useDocsStore } from '@/stores/docs-store';

interface TreeNode {
  name: string;
  path: string;
  type: 'folder' | 'ivk' | 'md';
  children: TreeNode[];
}

/**
 * Build a unified tree from both .ivk and .md file lists.
 * Folders are sorted first, then files alphabetically.
 */
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

    // If the folder has a parent, nest it
    if (parts.length > 1) {
      const parentPath = parts.slice(0, -1).join('/');
      const parent = ensureFolder(parentPath);
      // Avoid duplicates
      if (!parent.children.some((c) => c.path === folderPath)) {
        parent.children.push(node);
      }
    } else {
      // Top-level folder
      if (!root.some((c) => c.path === folderPath)) {
        root.push(node);
      }
    }

    return node;
  }

  // Add .ivk files
  for (const file of ivkFiles) {
    const parts = file.path.split('/');
    const node: TreeNode = {
      name: parts[parts.length - 1]!.replace('.ivk', ''),
      path: file.path,
      type: 'ivk',
      children: [],
    };

    if (parts.length > 1) {
      const folderPath = parts.slice(0, -1).join('/');
      ensureFolder(folderPath).children.push(node);
    } else {
      root.push(node);
    }
  }

  // Add .md files
  for (const doc of mdFiles) {
    const parts = doc.path.split('/');
    const node: TreeNode = {
      name: parts[parts.length - 1]!.replace('.md', ''),
      path: doc.path,
      type: 'md',
      children: [],
    };

    if (parts.length > 1) {
      const folderPath = parts.slice(0, -1).join('/');
      ensureFolder(folderPath).children.push(node);
    } else {
      root.push(node);
    }
  }

  // Sort recursively: folders first, then alphabetical
  function sortChildren(nodes: TreeNode[]) {
    nodes.sort((a, b) => {
      const aFolder = a.type === 'folder' ? 0 : 1;
      const bFolder = b.type === 'folder' ? 0 : 1;
      if (aFolder !== bFolder) return aFolder - bFolder;
      return a.name.localeCompare(b.name);
    });
    for (const n of nodes) {
      if (n.type === 'folder') sortChildren(n.children);
    }
  }
  sortChildren(root);

  return root;
}

/** Count all non-folder children (files) in a tree node, recursively. */
function countFiles(node: TreeNode): number {
  if (node.type !== 'folder') return 1;
  let count = 0;
  for (const child of node.children) {
    count += countFiles(child);
  }
  return count;
}

const methodBadgeColors: Record<HttpMethod, string> = {
  GET: 'bg-green-500/20 text-green-400',
  POST: 'bg-amber-500/20 text-amber-400',
  PUT: 'bg-blue-500/20 text-blue-400',
  PATCH: 'bg-purple-500/20 text-purple-400',
  DELETE: 'bg-red-500/20 text-red-400',
};

function MethodBadge({ method }: { method: HttpMethod }) {
  const color = methodBadgeColors[method] ?? 'bg-gray-500/20 text-gray-400';
  return (
    <span
      className={`inline-flex items-center justify-center rounded-sm text-[8px] font-mono font-bold leading-none flex-shrink-0 ${color}`}
      style={{ width: 28, height: 14 }}
    >
      {method.length > 3 ? method.slice(0, 3) : method}
    </span>
  );
}

/** Indentation guides: render subtle vertical lines for each depth level. */
function IndentGuides({ depth }: { depth: number }) {
  if (depth === 0) return null;
  return (
    <>
      {Array.from({ length: depth }, (_, i) => (
        <span
          key={i}
          className="absolute top-0 bottom-0 border-l border-outline-variant/20"
          style={{ left: 12 + i * 16 + 7 }}
        />
      ))}
    </>
  );
}

function TreeItem({ node, depth = 0 }: { node: TreeNode; depth?: number }) {
  const activeFilePath = useCollectionStore((s) => s.activeFilePath);
  const setActiveFile = useCollectionStore((s) => s.setActiveFile);
  const ivkExpandedFolders = useCollectionStore((s) => s.expandedFolders);
  const toggleIvkFolder = useCollectionStore((s) => s.toggleFolder);

  const activeDocPath = useDocsStore((s) => s.activeDocPath);
  const setActiveDoc = useDocsStore((s) => s.setActiveDoc);
  const docExpandedFolders = useDocsStore((s) => s.expandedFolders);
  const toggleDocFolder = useDocsStore((s) => s.toggleFolder);

  const getFileByPath = useCollectionStore((s) => s.getFileByPath);

  const pl = 12 + depth * 16;

  if (node.type === 'folder') {
    // Folder expanded state: check both stores
    const isExpanded = ivkExpandedFolders.has(node.path) || docExpandedFolders.has(node.path);
    const fileCount = countFiles(node);

    const handleToggle = () => {
      // Toggle in both stores to keep them in sync
      toggleIvkFolder(node.path);
      toggleDocFolder(node.path);
    };

    return (
      <div>
        <button
          className="relative w-full flex items-center gap-1.5 py-2 px-2 text-xs text-on-surface-variant hover:bg-surface-container/70 hover:text-on-surface transition-colors duration-150"
          style={{ paddingLeft: pl }}
          onClick={handleToggle}
        >
          <IndentGuides depth={depth} />
          {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          {isExpanded ? (
            <FolderOpen size={14} className="text-amber-400 flex-shrink-0" />
          ) : (
            <Folder size={14} className="text-amber-400 flex-shrink-0" />
          )}
          <span className="truncate">{node.name}</span>
          <span className="ml-auto text-[9px] text-outline/60 tabular-nums">
            {fileCount}
          </span>
        </button>
        {isExpanded &&
          node.children.map((child) => (
            <TreeItem key={child.path} node={child} depth={depth + 1} />
          ))}
      </div>
    );
  }

  // File node
  const isIvk = node.type === 'ivk';
  const isActive = isIvk
    ? activeFilePath === node.path
    : activeDocPath === node.path;

  // Parse method from .ivk file content
  const method = useMemo<HttpMethod | null>(() => {
    if (!isIvk) return null;
    const file = getFileByPath(node.path);
    if (!file) return null;
    try {
      const parsed = parseIvk(file.content);
      return parsed.method;
    } catch {
      return null;
    }
  }, [isIvk, node.path, getFileByPath]);

  const handleClick = () => {
    if (isIvk) {
      setActiveFile(node.path);
      // Clear doc selection
      useDocsStore.getState().clearActiveDoc();
    } else {
      setActiveDoc(node.path);
      // Clear ivk selection
      useCollectionStore.getState().setActiveFile('');
    }
  };

  return (
    <button
      className={`relative w-full flex items-center gap-1.5 py-2 px-2 text-xs transition-colors duration-150 ${
        isActive
          ? 'bg-primary/10 text-primary'
          : 'text-on-surface-variant hover:bg-surface-container/70 hover:text-on-surface'
      }`}
      style={{ paddingLeft: pl + 16 }}
      onClick={handleClick}
    >
      <IndentGuides depth={depth} />
      {/* Active file left accent bar */}
      {isActive && (
        <span className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-primary" />
      )}
      {isIvk && method ? (
        <MethodBadge method={method} />
      ) : isIvk ? (
        <Zap size={14} className="text-amber-400 flex-shrink-0" />
      ) : (
        <FileText size={14} className="text-blue-400 flex-shrink-0" />
      )}
      <span className="truncate">{node.name}</span>
    </button>
  );
}

export function UnifiedTree() {
  const ivkFiles = useCollectionStore((s) => s.files);
  const mdFiles = useDocsStore((s) => s.docs);
  const tree = buildUnifiedTree(ivkFiles, mdFiles);

  if (tree.length === 0) {
    return (
      <div className="px-3 py-4 text-xs text-outline text-center">
        No files loaded
      </div>
    );
  }

  return (
    <div className="py-1">
      {tree.map((node) => (
        <TreeItem key={node.path} node={node} />
      ))}
    </div>
  );
}
