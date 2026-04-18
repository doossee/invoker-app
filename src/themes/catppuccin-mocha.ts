import type { InvokerTheme } from './theme-types';

export const catppuccinMocha: InvokerTheme = {
  name: 'Catppuccin Mocha',
  id: 'catppuccin-mocha',
  type: 'dark',
  colors: {
    // MD3 Surface containers
    surfaceLowest: '#11111b',
    surfaceLow: '#181825',
    surface: '#1e1e2e',
    surfaceContainer: '#313244',
    surfaceHigh: '#45475a',
    surfaceHighest: '#585b70',

    // Text
    onSurface: '#cdd6f4',
    onSurfaceVariant: '#a6adc8',
    outline: '#6c7086',
    outlineVariant: '#45475a',

    // Accent
    primary: '#89b4fa',
    onPrimary: '#003c88',
    secondary: '#cba6f7',
    tertiary: '#a6e3a1',
    error: '#f38ba8',

    // Semantic
    success: '#a6e3a1',
    warning: '#f9e2af',
    info: '#89b4fa',

    // Method badges
    methodGet: '#a6e3a1',
    methodPost: '#f9e2af',
    methodPut: '#89b4fa',
    methodPatch: '#cba6f7',
    methodDelete: '#f38ba8',

    // Variables
    varSet: '#cba6f7',
    varUnset: '#f38ba8',

    // Editor
    editorBg: '#1e1e2e',
    editorGutter: '#181825',
    editorSelection: 'rgba(137, 180, 250, 0.2)',
  },
};
