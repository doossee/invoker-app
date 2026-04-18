import { useMemo } from 'react';
import { ChevronRight, ChevronDown, Zap, FileText, Folder, FolderOpen, BookOpen } from 'lucide-react';
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

  // Add .md files — skip README.md (implicit in its parent folder)
  for (const doc of mdFiles) {
    const lowerPath = doc.path.toLowerCase();
    if (lowerPath.endsWith('/readme.md') || lowerPath === 'readme.md') {
      continue;
    }
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

const methodBadgeStyles: Record<HttpMethod, { bg: string; color: string }> = {
  GET: { bg: 'var(--ivk-method-get)', color: 'var(--ivk-method-get)' },
  POST: { bg: 'var(--ivk-method-post)', color: 'var(--ivk-method-post)' },
  PUT: { bg: 'var(--ivk-method-put)', color: 'var(--ivk-method-put)' },
  PATCH: { bg: 'var(--ivk-method-patch)', color: 'var(--ivk-method-patch)' },
  DELETE: { bg: 'var(--ivk-method-delete)', color: 'var(--ivk-method-delete)' },
};

function MethodBadge({ method }: { method: HttpMethod }) {
  const style = methodBadgeStyles[method] ?? { bg: 'var(--ivk-outline)', color: 'var(--ivk-outline)' };
  const label = method === 'DELETE' ? 'DEL' : method;
  return (
    <span
      className="inline-flex items-center justify-center rounded-sm text-[0.625rem] font-bold tracking-wider leading-none flex-shrink-0 px-1"
      style={{
        color: style.color,
        backgroundColor: `color-mix(in srgb, ${style.bg} 15%, transparent)`,
        minWidth: 28,
        height: 16,
      }}
    >
      {label}
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
          className="absolute top-0 bottom-0 border-l border-outline-variant/15"
          style={{ left: 12 + i * 24 + 11 }}
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

  const pl = 12 + depth * 24;

  if (node.type === 'folder') {
    // Folder expanded state: check both stores
    const isExpanded = ivkExpandedFolders.has(node.path) || docExpandedFolders.has(node.path);
    const fileCount = countFiles(node);

    // Check if this folder has a README.md in the docs store
    const docs = useDocsStore.getState().docs;
    const readmePath = `${node.path}/README.md`;
    const readme = docs.find(
      (d) =>
        d.path.toLowerCase() === readmePath.toLowerCase() ||
        d.path.toLowerCase() === `${node.path}/readme.md`,
    );
    const hasReadme = !!readme;
    const isReadmeActive = activeDocPath === readme?.path;

    const handleToggle = () => {
      // Toggle in both stores to keep them in sync
      toggleIvkFolder(node.path);
      toggleDocFolder(node.path);

      // If this folder has a README, open it in the doc renderer
      if (readme) {
        useDocsStore.getState().setActiveDoc(readme.path);
        useCollectionStore.getState().setActiveFile('');
      }
    };

    return (
      <div>
        <button
          className={`relative w-full flex items-center gap-2 py-2 px-3 text-sm transition-colors duration-150 ${
            isReadmeActive
              ? 'bg-surface-highest text-primary'
              : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
          }`}
          style={{ paddingLeft: pl }}
          onClick={handleToggle}
        >
          <IndentGuides depth={depth} />
          {/* Active README left accent bar */}
          {isReadmeActive && (
            <span className="absolute left-0 top-0.5 bottom-0.5 w-[2px] rounded-full bg-primary" />
          )}
          <span className="flex-shrink-0 text-outline">
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
          {isExpanded ? (
            <FolderOpen size={15} className="text-amber-400 flex-shrink-0" />
          ) : (
            <Folder size={15} className="text-amber-400 flex-shrink-0" />
          )}
          <span className="truncate font-medium">{node.name}</span>
          {hasReadme && (
            <span title="Has README" className="flex-shrink-0">
              <BookOpen
                size={11}
                className={isReadmeActive ? 'text-primary' : 'text-outline/40'}
              />
            </span>
          )}
          <span className="ml-auto text-[0.625rem] text-outline/50 tabular-nums font-medium">
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
      className={`relative w-full flex items-center gap-2 py-2 px-3 text-sm transition-colors duration-150 ${
        isActive
          ? 'bg-surface-highest text-primary'
          : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
      }`}
      style={{ paddingLeft: pl + 24 }}
      onClick={handleClick}
    >
      <IndentGuides depth={depth} />
      {/* Active file left accent bar */}
      {isActive && (
        <span className="absolute left-0 top-0.5 bottom-0.5 w-[2px] rounded-full bg-primary" />
      )}
      {isIvk && method ? (
        <MethodBadge method={method} />
      ) : isIvk ? (
        <Zap size={14} className="text-amber-400 flex-shrink-0" />
      ) : (
        <FileText size={14} className="text-blue-400/80 flex-shrink-0" />
      )}
      <span className="truncate">{node.name}</span>
      {!isIvk && (
        <span className="ml-auto text-[0.5625rem] font-bold tracking-wider text-outline/40 flex-shrink-0">
          MD
        </span>
      )}
    </button>
  );
}

export function UnifiedTree() {
  const ivkFiles = useCollectionStore((s) => s.files);
  const mdFiles = useDocsStore((s) => s.docs);
  const tree = buildUnifiedTree(ivkFiles, mdFiles);

  if (tree.length === 0) {
    return (
      <div className="px-3 py-6 text-xs text-outline text-center">
        No files loaded
      </div>
    );
  }

  return (
    <div className="py-1.5">
      {tree.map((node) => (
        <TreeItem key={node.path} node={node} />
      ))}
    </div>
  );
}
