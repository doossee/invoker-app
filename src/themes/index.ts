import type { InvokerTheme } from './theme-types';
import { invokerDark } from './invoker-dark';
import { invokerLight } from './invoker-light';
import { catppuccinMocha } from './catppuccin-mocha';
import { tokyoNight } from './tokyo-night';
import { githubDark } from './github-dark';

export type { InvokerTheme } from './theme-types';

// Order shown in Settings → Appearance. Default (Invoker Dark) first.
export const themes: InvokerTheme[] = [
  invokerDark,
  invokerLight,
  catppuccinMocha,
  tokyoNight,
  githubDark,
];

export function getTheme(id: string): InvokerTheme {
  return themes.find((t) => t.id === id) ?? invokerDark;
}
