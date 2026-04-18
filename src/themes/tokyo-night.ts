import type { InvokerTheme } from './theme-types';

export const tokyoNight: InvokerTheme = {
  name: 'Tokyo Night',
  id: 'tokyo-night',
  type: 'dark',
  colors: {
    // MD3 Surface containers
    surfaceLowest: '#16171f',
    surfaceLow: '#1a1b26',
    surface: '#1a1b26',
    surfaceContainer: '#24283b',
    surfaceHigh: '#292e42',
    surfaceHighest: '#33384e',

    // Text
    onSurface: '#a9b1d6',
    onSurfaceVariant: '#787c99',
    outline: '#565a6e',
    outlineVariant: '#3b4261',

    // Accent
    primary: '#7aa2f7',
    onPrimary: '#002c72',
    secondary: '#bb9af7',
    tertiary: '#9ece6a',
    error: '#f7768e',

    // Semantic
    success: '#9ece6a',
    warning: '#e0af68',
    info: '#7aa2f7',

    // Method badges
    methodGet: '#9ece6a',
    methodPost: '#e0af68',
    methodPut: '#7aa2f7',
    methodPatch: '#bb9af7',
    methodDelete: '#f7768e',

    // Variables
    varSet: '#bb9af7',
    varUnset: '#f7768e',

    // Editor
    editorBg: '#1a1b26',
    editorGutter: '#16171f',
    editorSelection: 'rgba(122, 162, 247, 0.2)',
  },
};
