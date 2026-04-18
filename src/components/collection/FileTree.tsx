import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from 'lucide-react';
import { useCollectionStore } from '@/stores/collection-store';

interface TreeNode {
  name: string;
  path: string;
  isFolder: boolean;
  children: TreeNode[];
}

function buildTree(files: { path: string; name: string }[]): TreeNode[] {
  const root: TreeNode[] = [];
  const folderMap = new Map<string, TreeNode>();

  // Create folders
  for (const file of files) {
    const parts = file.path.split('/');
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
  for (const file of files) {
    const parts = file.path.split('/');
    const node: TreeNode = {
      name: parts[parts.length - 1]!.replace('.ivk', ''),
      path: file.path,
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
  const activeFilePath = useCollectionStore((s) => s.activeFilePath);
  const expandedFolders = useCollectionStore((s) => s.expandedFolders);
  const setActiveFile = useCollectionStore((s) => s.setActiveFile);
  const toggleFolder = useCollectionStore((s) => s.toggleFolder);

  const isExpanded = expandedFolders.has(node.path);
  const isActive = activeFilePath === node.path;
  const pl = 12 + depth * 16;

  if (node.isFolder) {
    return (
      <div>
        <button
          className="w-full flex items-center gap-1.5 py-1 px-2 text-xs text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
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
          ? 'bg-primary/10 text-primary'
          : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
      }`}
      style={{ paddingLeft: pl + 16 }}
      onClick={() => setActiveFile(node.path)}
    >
      <File size={14} />
      <span className="truncate">{node.name}</span>
      <span className="ml-auto text-[9px] text-outline font-mono uppercase">ivk</span>
    </button>
  );
}

export function FileTree() {
  const files = useCollectionStore((s) => s.files);
  const tree = buildTree(files);

  return (
    <div className="py-1">
      {tree.map((node) => (
        <TreeItem key={node.path} node={node} />
      ))}
    </div>
  );
}
