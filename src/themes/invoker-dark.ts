import type { InvokerTheme } from './theme-types';

export const invokerDark: InvokerTheme = {
  name: 'Invoker Dark',
  id: 'invoker-dark',
  type: 'dark',
  colors: {
    // MD3 Surface containers
    surfaceLowest: '#0a0e14',
    surfaceLow: '#181c22',
    surface: '#10141a',
    surfaceContainer: '#1c2026',
    surfaceHigh: '#262a31',
    surfaceHighest: '#31353c',

    // Text
    onSurface: '#dfe2eb',
    onSurfaceVariant: '#c2c6d6',
    outline: '#8c909f',
    outlineVariant: '#424754',

    // Accent
    primary: '#adc6ff',
    onPrimary: '#002e6a',
    secondary: '#ddb7ff',
    tertiary: '#4ae176',
    error: '#ffb4ab',

    // Semantic
    success: '#4ae176',
    warning: '#f59e0b',
    info: '#adc6ff',

    // Method badges
    methodGet: '#4ae176',
    methodPost: '#f59e0b',
    methodPut: '#adc6ff',
    methodPatch: '#ddb7ff',
    methodDelete: '#ffb4ab',

    // Variables
    varSet: '#ddb7ff',
    varUnset: '#ffb4ab',

    // Editor
    editorBg: '#0a0e14',
    editorGutter: '#10141a',
    editorSelection: 'rgba(173, 198, 255, 0.15)',
  },
};
