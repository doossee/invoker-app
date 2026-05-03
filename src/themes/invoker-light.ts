import type { InvokerTheme } from './theme-types';

/**
 * Daylight palette. Same MD3 surface ladder as Invoker Dark, just inverted:
 * the lowest surface becomes the brightest. Accent stays warm-amber so the
 * brand reads as "Invoker" no matter the background.
 *
 * Picked deliberately-light surface tones (off-white instead of #fff) so
 * the JetBrains Mono editor doesn't shimmer at high brightness, and so
 * faint outlines stay visible without grey-on-grey muddiness.
 */
export const invokerLight: InvokerTheme = {
  name: 'Invoker Light',
  id: 'invoker-light',
  type: 'light',
  colors: {
    // MD3 Surface containers — invert the depth ladder.
    surfaceLowest: '#ffffff',
    surfaceLow: '#fafaf8',
    surface: '#f6f5f1',
    surfaceContainer: '#eeede8',
    surfaceHigh: '#e6e4dd',
    surfaceHighest: '#dad7ce',

    // Text — dark on light, with the variant slightly muted for hierarchy.
    onSurface: '#1c1b18',
    onSurfaceVariant: '#5a5854',
    outline: '#8c8a85',
    outlineVariant: '#cdcac0',

    // Accent — same amber but darker so contrast against light surfaces
    // hits AA. onPrimary is near-white so amber buttons read as buttons.
    primary: '#9a6d18',
    onPrimary: '#fff7e6',
    secondary: '#7d5a1a',
    tertiary: '#a55c20',
    error: '#c33333',

    // Semantic
    success: '#1f9444',
    warning: '#c08210',
    info: '#3960aa',

    // Method badges — keep the brand hue family but bump saturation/darkness
    // so the small badges stay legible on light surfaces.
    methodGet: '#1f9444',
    methodPost: '#9a6d18',
    methodPut: '#7d5a1a',
    methodPatch: '#a55c20',
    methodDelete: '#c33333',

    // Variables
    varSet: '#7d5a1a',
    varUnset: '#c33333',

    // Editor
    editorBg: '#fafaf8',
    editorGutter: '#f1efea',
    editorSelection: 'rgba(154, 109, 24, 0.18)',
  },
};
