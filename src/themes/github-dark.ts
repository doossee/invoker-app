import type { InvokerTheme } from './theme-types';

export const githubDark: InvokerTheme = {
  name: 'GitHub Dark',
  id: 'github-dark',
  type: 'dark',
  colors: {
    // MD3 Surface containers
    surfaceLowest: '#0a0e14',
    surfaceLow: '#0d1117',
    surface: '#0d1117',
    surfaceContainer: '#161b22',
    surfaceHigh: '#1c2128',
    surfaceHighest: '#272c33',

    // Text
    onSurface: '#c9d1d9',
    onSurfaceVariant: '#8b949e',
    outline: '#484f58',
    outlineVariant: '#30363d',

    // Accent
    primary: '#58a6ff',
    onPrimary: '#002e6a',
    secondary: '#bc8cff',
    tertiary: '#3fb950',
    error: '#f85149',

    // Semantic
    success: '#3fb950',
    warning: '#d29922',
    info: '#58a6ff',

    // Method badges
    methodGet: '#3fb950',
    methodPost: '#d29922',
    methodPut: '#58a6ff',
    methodPatch: '#bc8cff',
    methodDelete: '#f85149',

    // Variables
    varSet: '#bc8cff',
    varUnset: '#f85149',

    // Editor
    editorBg: '#0d1117',
    editorGutter: '#0a0e14',
    editorSelection: 'rgba(88, 166, 255, 0.2)',
  },
};
