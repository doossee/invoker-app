import { create } from 'zustand';
import { EnvManager, DEFAULT_SETTINGS, type InvokerSettings } from 'ivkjs';
import { isPublished } from '@/lib/platform';

function getStorageKey(): string {
  return isPublished() ? 'invoker:visitor-env' : 'invoker:env';
}

/**
 * Color palette for new envs created via `addEnvironment`. Picked to
 * match the existing dev/stage/prod hues used in `loadSettings` and
 * `Sidebar`'s ENV_COLORS map, plus a few extras so users adding a 4th
 * or 5th environment get visually distinct dots.
 *
 * `addEnvironment` walks the palette, skipping colors already in use,
 * and falls back to round-robin once every hue is taken.
 */
const ENV_COLOR_PALETTE = [
  '#22c55e', // green (dev)
  '#f59e0b', // amber (stage)
  '#f97758', // red-orange (prod)
  '#3b82f6', // blue
  '#a855f7', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#facc15', // yellow
] as const;

function loadSettings(): InvokerSettings {
  try {
    const stored = localStorage.getItem(getStorageKey());
    if (stored) return JSON.parse(stored) as InvokerSettings;
  } catch {
    // ignore
  }
  // Default with httpbin for demo
  return {
    ...DEFAULT_SETTINGS,
    environments: [
      {
        name: 'dev',
        variables: {
          baseUrl: 'https://httpbin.org',
          phone: '998901234567',
          userName: 'Ali',
          userEmail: 'ali@example.com',
        },
        color: '#22c55e',
      },
      {
        name: 'stage',
        variables: {
          baseUrl: 'https://httpbin.org',
          phone: '998941102208',
        },
        color: '#f59e0b',
      },
    ],
  };
}

interface EnvState {
  settings: InvokerSettings;
  envManager: EnvManager;
  authorDefaults: Record<string, string>;
  setActiveEnv: (index: number) => void;
  setVariable: (name: string, value: string) => void;
  addEnvironment: (name: string) => void;
  deleteEnvironment: (index: number) => void;
  persist: () => void;
  setAuthorDefaults: (defaults: Record<string, string>) => void;
  resetToDefaults: () => void;
}

export const useEnvStore = create<EnvState>((set, get) => {
  const settings = loadSettings();
  const envManager = new EnvManager(() => get().settings);
  envManager.setSaveCallback(async () => get().persist());

  return {
    settings,
    envManager,
    authorDefaults: {},

    setActiveEnv: (index) => {
      set((state) => ({
        settings: { ...state.settings, activeEnvironmentIndex: index },
      }));
      get().persist();
    },

    setVariable: (name, value) => {
      // Delegate to ivkjs's EnvManager so script-side `ivk.env.set()`
      // and React-side calls share one runtimeVars / variables map.
      // EnvManager.set mutates the active env's `variables` in place
      // (so the request runner sees the new value immediately) — but
      // that mutation alone doesn't change any references zustand
      // selectors compare against. Rebuild the environments array
      // immutably so deep selectors re-render. (Same root cause as
      // the resetToDefaults / setAuthorDefaults fixes above.)
      get().envManager.set(name, value);
      set((state) => {
        const idx = state.settings.activeEnvironmentIndex;
        const target = state.settings.environments[idx];
        if (!target) return { settings: { ...state.settings } };
        const nextEnvs = state.settings.environments.map((e, i) =>
          i === idx ? { ...e, variables: { ...e.variables } } : e,
        );
        return { settings: { ...state.settings, environments: nextEnvs } };
      });
    },

    addEnvironment: (name) => {
      set((state) => {
        // Pick a color from a small visually-distinct palette,
        // skipping colors already in use so each new env gets a
        // dot that's easy to tell apart at a glance. Falls back to
        // cycling once we run out of fresh hues. (Sidebar's env dot
        // honors `env.color` after PR #72; without an explicit color
        // here, the dot fell through to a muted gray and looked
        // indistinguishable from a missing env.)
        const used = new Set(
          state.settings.environments.map((e) => e.color).filter(Boolean) as string[],
        );
        const fresh = ENV_COLOR_PALETTE.find((c) => !used.has(c));
        const color =
          fresh ??
          ENV_COLOR_PALETTE[state.settings.environments.length % ENV_COLOR_PALETTE.length]!;
        return {
          settings: {
            ...state.settings,
            environments: [
              ...state.settings.environments,
              { name, variables: {}, color },
            ],
          },
        };
      });
      get().persist();
    },

    deleteEnvironment: (index) => {
      set((state) => {
        const envs = state.settings.environments.filter((_, i) => i !== index);
        const activeIdx = Math.min(state.settings.activeEnvironmentIndex, envs.length - 1);
        return {
          settings: { ...state.settings, environments: envs, activeEnvironmentIndex: activeIdx },
        };
      });
      get().persist();
    },

    persist: () => {
      localStorage.setItem(getStorageKey(), JSON.stringify(get().settings));
    },

    setAuthorDefaults: (defaults) => {
      set({ authorDefaults: defaults });
      const state = get();
      const idx = state.settings.activeEnvironmentIndex;
      const target = state.settings.environments[idx];
      if (!target) {
        get().persist();
        return;
      }
      // Same immutability fix as resetToDefaults below — was mutating
      // `env.variables[key]` in place, so zustand selectors deeper than
      // `s.settings` skipped the re-render.
      const mergedVars = { ...target.variables };
      for (const [key, value] of Object.entries(defaults)) {
        if (!mergedVars[key]) mergedVars[key] = value;
      }
      const nextEnvs = state.settings.environments.map((e, i) =>
        i === idx ? { ...e, variables: mergedVars } : e,
      );
      set({ settings: { ...state.settings, environments: nextEnvs } });
      get().persist();
    },

    resetToDefaults: () => {
      const state = get();
      const defaults = state.authorDefaults;
      const idx = state.settings.activeEnvironmentIndex;
      const target = state.settings.environments[idx];
      if (!target) return;
      // Rebuild the environments array immutably so every reference
      // along the path (environments → environments[idx] → .variables)
      // changes. The previous implementation mutated `env.variables`
      // in place and only shallow-cloned `settings`, so zustand
      // selectors subscribing to deeper paths skipped the re-render
      // (see `env-store-reset.test.ts` for the contract).
      const nextEnvs = state.settings.environments.map((e, i) =>
        i === idx ? { ...e, variables: { ...defaults } } : e,
      );
      set({ settings: { ...state.settings, environments: nextEnvs } });
      get().persist();
    },
  };
});

// Expose store globally for CodeMirror tooltip (non-React context)
(window as any).__ivk_env_store = useEnvStore;
