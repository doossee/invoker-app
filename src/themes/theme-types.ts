export interface InvokerTheme {
  name: string;
  id: string;
  type: 'dark' | 'light';
  colors: {
    // MD3 Surface containers (6 levels)
    surfaceLowest: string;
    surfaceLow: string;
    surface: string;
    surfaceContainer: string;
    surfaceHigh: string;
    surfaceHighest: string;

    // Text / on-surface
    onSurface: string;
    onSurfaceVariant: string;
    outline: string;
    outlineVariant: string;

    // Accent
    primary: string;
    onPrimary: string;
    secondary: string;
    tertiary: string;
    error: string;

    // Semantic (kept for badges, status)
    success: string;
    warning: string;
    info: string;

    // Method badges
    methodGet: string;
    methodPost: string;
    methodPut: string;
    methodPatch: string;
    methodDelete: string;

    // Variables
    varSet: string;
    varUnset: string;

    // Editor
    editorBg: string;
    editorGutter: string;
    editorSelection: string;

    // Legacy aliases (mapped from MD3 values in the theme provider)
    // These are derived — themes only need to set the MD3 values above
  };
}
