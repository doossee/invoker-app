export interface InvokerTheme {
  name: string;
  id: string;
  type: 'dark' | 'light';
  colors: {
    bg: string;
    surface: string;
    surfaceHover: string;
    surfaceActive: string;
    border: string;
    borderSubtle: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    accent: string;
    accentHover: string;
    accentSubtle: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    methodGet: string;
    methodPost: string;
    methodPut: string;
    methodPatch: string;
    methodDelete: string;
    varSet: string;
    varUnset: string;
    editorBg: string;
    editorGutter: string;
    editorSelection: string;
    sidebarBg: string;
    sidebarItemHover: string;
    sidebarItemActive: string;
    statusBarBg: string;
    statusBarText: string;
  };
}
