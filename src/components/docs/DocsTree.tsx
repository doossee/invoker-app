import { ChevronRight, ChevronDown, FileText, Folder, FolderOpen } from 'lucide-react';
import { useDocsStore } from '@/stores/docs-store';

interface TreeNode {
  name: string;
  path: string;
  isFolder: boolean;
  children: TreeNode[];
}

function buildTree(docs: { path: string; title: string }[]): TreeNode[] {
  const root: TreeNode[] = [];
  const folderMap = new Map<string, TreeNode>();

  // Create folders
  for (const doc of docs) {
    const parts = doc.path.split('/');
    if (parts.length > 1) {
      const folderPath = parts.slice(0, -1).join('/');
      if (!folderMap.has(folderPath)) {
        folderMap.set(folderPath, {
          name: parts[parts.length - 2]!,
          path: folderPath,
          isFolder: true,
          children: [],
        });
      }
    }
  }

  // Assign files to folders or root
  for (const doc of docs) {
    const parts = doc.path.split('/');
    const node: TreeNode = {
      name: parts[parts.length - 1]!.replace('.md', ''),
      path: doc.path,
      isFolder: false,
      children: [],
    };

    if (parts.length > 1) {
      const folderPath = parts.slice(0, -1).join('/');
      folderMap.get(folderPath)?.children.push(node);
    } else {
      root.push(node);
    }
  }

  // Add folders to root
  for (const folder of folderMap.values()) {
    folder.children.sort((a, b) => {
      if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    root.push(folder);
  }

  root.sort((a, b) => {
    if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return root;
}

function TreeItem({ node, depth = 0 }: { node: TreeNode; depth?: number }) {
  const activeDocPath = useDocsStore((s) => s.activeDocPath);
  const expandedFolders = useDocsStore((s) => s.expandedFolders);
  const setActiveDoc = useDocsStore((s) => s.setActiveDoc);
  const toggleFolder = useDocsStore((s) => s.toggleFolder);

  const isExpanded = expandedFolders.has(node.path);
  const isActive = activeDocPath === node.path;
  const pl = 12 + depth * 16;

  if (node.isFolder) {
    return (
      <div>
        <button
          className="w-full flex items-center gap-1.5 py-1 px-2 text-xs text-text-dim hover:bg-surface-2 hover:text-text-primary transition-colors"
          style={{ paddingLeft: pl }}
          onClick={() => toggleFolder(node.path)}
        >
          {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          {isExpanded ? <FolderOpen size={14} className="text-amber-400" /> : <Folder size={14} className="text-amber-400" />}
          <span className="truncate">{node.name}</span>
        </button>
        {isExpanded &&
          node.children.map((child) => (
            <TreeItem key={child.path} node={child} depth={depth + 1} />
          ))}
      </div>
    );
  }

  return (
    <button
      className={`w-full flex items-center gap-1.5 py-1 px-2 text-xs transition-colors ${
        isActive
          ? 'bg-accent/10 text-accent'
          : 'text-text-dim hover:bg-surface-2 hover:text-text-primary'
      }`}
      style={{ paddingLeft: pl + 16 }}
      onClick={() => setActiveDoc(node.path)}
    >
      <FileText size={14} />
      <span className="truncate">{node.name}</span>
      <span className="ml-auto text-[9px] text-text-muted font-mono uppercase">md</span>
    </button>
  );
}

export function DocsTree() {
  const docs = useDocsStore((s) => s.docs);
  const tree = buildTree(docs);

  return (
    <div className="py-1">
      {tree.map((node) => (
        <TreeItem key={node.path} node={node} />
      ))}
    </div>
  );
}
