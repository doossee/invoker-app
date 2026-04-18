import type { InvokerTheme } from './theme-types';

export const invokerDark: InvokerTheme = {
  name: 'Invoker Dark',
  id: 'invoker-dark',
  type: 'dark',
  colors: {
    // MD3 Surface containers
    surfaceLowest: '#000000',
    surfaceLow: '#131313',
    surface: '#0e0e0e',
    surfaceContainer: '#191a1a',
    surfaceHigh: '#1f2020',
    surfaceHighest: '#252626',

    // Text
    onSurface: '#e7e5e4',
    onSurfaceVariant: '#acabaa',
    outline: '#767575',
    outlineVariant: '#484848',

    // Accent
    primary: '#e6c188',
    onPrimary: '#543c0e',
    secondary: '#dbc3a1',
    tertiary: '#ffcdb3',
    error: '#f97758',

    // Semantic
    success: '#4ae176',
    warning: '#e6c188',
    info: '#dbc3a1',

    // Method badges
    methodGet: '#4ae176',
    methodPost: '#e6c188',
    methodPut: '#dbc3a1',
    methodPatch: '#ffcdb3',
    methodDelete: '#f97758',

    // Variables
    varSet: '#dbc3a1',
    varUnset: '#f97758',

    // Editor
    editorBg: '#0e0e0e',
    editorGutter: '#131313',
    editorSelection: 'rgba(230, 193, 136, 0.15)',
  },
};
