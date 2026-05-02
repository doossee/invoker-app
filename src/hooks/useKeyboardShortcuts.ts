import { useEffect } from 'react';
import { matchShortcut } from '@/lib/shortcuts';

interface ShortcutHandlers {
  onSend?: () => void;
  onSwitchEnv?: () => void;
  onFormatJson?: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Cmd+Enter — Send request
      if (matchShortcut(e, 'Enter')) {
        e.preventDefault();
        handlers.onSend?.();
        return;
      }

      // Cmd+E — Switch environment
      if (matchShortcut(e, 'KeyE', { shift: false })) {
        e.preventDefault();
        handlers.onSwitchEnv?.();
        return;
      }

      // Cmd+Shift+F — Format JSON
      if (matchShortcut(e, 'KeyF', { shift: true })) {
        e.preventDefault();
        handlers.onFormatJson?.();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handlers]);
}
