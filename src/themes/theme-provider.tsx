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

  root.style.setProperty('--ivk-bg', colors.bg);
  root.style.setProperty('--ivk-surface', colors.surface);
  root.style.setProperty('--ivk-surface-hover', colors.surfaceHover);
  root.style.setProperty('--ivk-surface-active', colors.surfaceActive);
  root.style.setProperty('--ivk-border', colors.border);
  root.style.setProperty('--ivk-border-subtle', colors.borderSubtle);
  root.style.setProperty('--ivk-text', colors.text);
  root.style.setProperty('--ivk-text-secondary', colors.textSecondary);
  root.style.setProperty('--ivk-text-muted', colors.textMuted);
  root.style.setProperty('--ivk-accent', colors.accent);
  root.style.setProperty('--ivk-accent-hover', colors.accentHover);
  root.style.setProperty('--ivk-accent-subtle', colors.accentSubtle);
  root.style.setProperty('--ivk-success', colors.success);
  root.style.setProperty('--ivk-warning', colors.warning);
  root.style.setProperty('--ivk-error', colors.error);
  root.style.setProperty('--ivk-info', colors.info);
  root.style.setProperty('--ivk-method-get', colors.methodGet);
  root.style.setProperty('--ivk-method-post', colors.methodPost);
  root.style.setProperty('--ivk-method-put', colors.methodPut);
  root.style.setProperty('--ivk-method-patch', colors.methodPatch);
  root.style.setProperty('--ivk-method-delete', colors.methodDelete);
  root.style.setProperty('--ivk-var-set', colors.varSet);
  root.style.setProperty('--ivk-var-unset', colors.varUnset);
  root.style.setProperty('--ivk-editor-bg', colors.editorBg);
  root.style.setProperty('--ivk-editor-gutter', colors.editorGutter);
  root.style.setProperty('--ivk-editor-selection', colors.editorSelection);
  root.style.setProperty('--ivk-sidebar-bg', colors.sidebarBg);
  root.style.setProperty('--ivk-sidebar-item-hover', colors.sidebarItemHover);
  root.style.setProperty('--ivk-sidebar-item-active', colors.sidebarItemActive);
  root.style.setProperty('--ivk-status-bar-bg', colors.statusBarBg);
  root.style.setProperty('--ivk-status-bar-text', colors.statusBarText);

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
