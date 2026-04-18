import { useState } from 'react';
import { FolderOpen, Settings2, History, Variable, BookOpen, HelpCircle } from 'lucide-react';

interface ActivityItem {
  id: string;
  icon: React.ReactNode;
  label: string;
}

const topItems: ActivityItem[] = [
  { id: 'collections', icon: <FolderOpen size={20} />, label: 'Collections' },
  { id: 'environments', icon: <Settings2 size={20} />, label: 'Environments' },
  { id: 'history', icon: <History size={20} />, label: 'History' },
  { id: 'variables', icon: <Variable size={20} />, label: 'Variables' },
];

const bottomItems: ActivityItem[] = [
  { id: 'docs', icon: <BookOpen size={20} />, label: 'Documentation' },
  { id: 'help', icon: <HelpCircle size={20} />, label: 'Support' },
];

export function ActivityBar() {
  const [activeId, setActiveId] = useState('collections');

  return (
    <div className="w-12 h-full bg-surface-lowest flex flex-col items-center py-2 flex-shrink-0 ghost-border-r">
      {/* Top items */}
      <div className="flex flex-col items-center gap-1">
        {topItems.map((item) => (
          <ActivityBarButton
            key={item.id}
            item={item}
            isActive={activeId === item.id}
            onClick={() => setActiveId(item.id)}
          />
        ))}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom items */}
      <div className="flex flex-col items-center gap-1">
        {bottomItems.map((item) => (
          <ActivityBarButton
            key={item.id}
            item={item}
            isActive={activeId === item.id}
            onClick={() => setActiveId(item.id)}
          />
        ))}
      </div>
    </div>
  );
}

function ActivityBarButton({
  item,
  isActive,
  onClick,
}: {
  item: ActivityItem;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={item.label}
      className={`relative w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
        isActive
          ? 'text-on-surface bg-surface-container'
          : 'text-outline hover:text-on-surface-variant hover:bg-surface-container/50'
      }`}
    >
      {/* Left accent indicator */}
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 bg-primary rounded-r-full" />
      )}
      {item.icon}
    </button>
  );
}
