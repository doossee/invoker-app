import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { themes, getTheme, type InvokerTheme } from './index';

interface ThemeContextValue {
  theme: InvokerTheme;
  setTheme: (id: string) => void;
  themes: InvokerTheme[];
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = 'invoker:theme';

/** Map a theme's colors object to CSS custom properties on the root element. */
function applyTheme(theme: InvokerTheme) {
  const root = document.documentElement;
  const { colors } = theme;

  // MD3 Surface containers
  root.style.setProperty('--ivk-surface-lowest', colors.surfaceLowest);
  root.style.setProperty('--ivk-surface-low', colors.surfaceLow);
  root.style.setProperty('--ivk-surface', colors.surface);
  root.style.setProperty('--ivk-surface-container', colors.surfaceContainer);
  root.style.setProperty('--ivk-surface-high', colors.surfaceHigh);
  root.style.setProperty('--ivk-surface-highest', colors.surfaceHighest);

  // Text / on-surface
  root.style.setProperty('--ivk-on-surface', colors.onSurface);
  root.style.setProperty('--ivk-on-surface-variant', colors.onSurfaceVariant);
  root.style.setProperty('--ivk-outline', colors.outline);
  root.style.setProperty('--ivk-outline-variant', colors.outlineVariant);

  // Accent
  root.style.setProperty('--ivk-primary', colors.primary);
  root.style.setProperty('--ivk-on-primary', colors.onPrimary);
  root.style.setProperty('--ivk-secondary', colors.secondary);
  root.style.setProperty('--ivk-tertiary', colors.tertiary);
  root.style.setProperty('--ivk-error', colors.error);

  // Semantic
  root.style.setProperty('--ivk-success', colors.success);
  root.style.setProperty('--ivk-warning', colors.warning);
  root.style.setProperty('--ivk-info', colors.info);

  // Method badges
  root.style.setProperty('--ivk-method-get', colors.methodGet);
  root.style.setProperty('--ivk-method-post', colors.methodPost);
  root.style.setProperty('--ivk-method-put', colors.methodPut);
  root.style.setProperty('--ivk-method-patch', colors.methodPatch);
  root.style.setProperty('--ivk-method-delete', colors.methodDelete);

  // Variables
  root.style.setProperty('--ivk-var-set', colors.varSet);
  root.style.setProperty('--ivk-var-unset', colors.varUnset);

  // Editor
  root.style.setProperty('--ivk-editor-bg', colors.editorBg);
  root.style.setProperty('--ivk-editor-gutter', colors.editorGutter);
  root.style.setProperty('--ivk-editor-selection', colors.editorSelection);

  // Legacy CSS variable aliases (backward compat for globals.css and CodeMirror)
  root.style.setProperty('--ivk-bg', colors.surfaceLowest);
  root.style.setProperty('--ivk-surface-hover', colors.surfaceContainer);
  root.style.setProperty('--ivk-surface-active', colors.surfaceHigh);
  root.style.setProperty('--ivk-border', colors.outlineVariant);
  root.style.setProperty('--ivk-border-subtle', colors.outlineVariant);
  root.style.setProperty('--ivk-text', colors.onSurface);
  root.style.setProperty('--ivk-text-secondary', colors.onSurfaceVariant);
  root.style.setProperty('--ivk-text-muted', colors.outline);
  root.style.setProperty('--ivk-accent', colors.primary);
  root.style.setProperty('--ivk-accent-hover', colors.primary);
  root.style.setProperty('--ivk-accent-subtle', `${colors.primary}26`);
  root.style.setProperty('--ivk-sidebar-bg', colors.surface);
  root.style.setProperty('--ivk-sidebar-item-hover', colors.surfaceContainer);
  root.style.setProperty('--ivk-sidebar-item-active', `${colors.primary}1a`);
  root.style.setProperty('--ivk-status-bar-bg', colors.surface);
  root.style.setProperty('--ivk-status-bar-text', colors.outline);

  // Set the theme type attribute for conditional CSS
  root.setAttribute('data-theme', theme.type);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY) ?? 'invoker-dark';
  });

  const theme = getTheme(themeId);

  // Apply CSS variables whenever theme changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = useCallback((id: string) => {
    setThemeId(id);
    localStorage.setItem(STORAGE_KEY, id);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
