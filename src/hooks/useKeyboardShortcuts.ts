import { useEffect } from 'react';

interface ShortcutHandlers {
  onSend?: () => void;
  onSwitchEnv?: () => void;
  onFormatJson?: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;

      // Cmd+Enter — Send request
      if (meta && e.key === 'Enter') {
        e.preventDefault();
        handlers.onSend?.();
      }

      // Cmd+E — Switch environment
      if (meta && e.key === 'e') {
        e.preventDefault();
        handlers.onSwitchEnv?.();
      }

      // Cmd+Shift+F — Format JSON
      if (meta && e.shiftKey && e.key === 'f') {
        e.preventDefault();
        handlers.onFormatJson?.();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handlers]);
}
