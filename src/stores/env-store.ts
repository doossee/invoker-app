import { create } from 'zustand';
import { EnvManager, DEFAULT_SETTINGS, type InvokerSettings } from 'ivkjs';
import { isPublished } from '@/lib/platform';

function getStorageKey(): string {
  return isPublished() ? 'invoker:visitor-env' : 'invoker:env';
}

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
      get().envManager.set(name, value);
      set((state) => ({ settings: { ...state.settings } })); // trigger re-render
    },

    addEnvironment: (name) => {
      set((state) => ({
        settings: {
          ...state.settings,
          environments: [...state.settings.environments, { name, variables: {} }],
        },
      }));
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
      const env = state.settings.environments[state.settings.activeEnvironmentIndex];
      if (env) {
        for (const [key, value] of Object.entries(defaults)) {
          if (!env.variables[key]) {
            env.variables[key] = value;
          }
        }
        set({ settings: { ...state.settings } });
      }
      get().persist();
    },

    resetToDefaults: () => {
      const state = get();
      const defaults = state.authorDefaults;
      const env = state.settings.environments[state.settings.activeEnvironmentIndex];
      if (env) {
        env.variables = { ...defaults };
        set({ settings: { ...state.settings } });
      }
      get().persist();
    },
  };
});

// Expose store globally for CodeMirror tooltip (non-React context)
(window as any).__ivk_env_store = useEnvStore;
