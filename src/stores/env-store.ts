import { create } from 'zustand';
import { EnvManager, DEFAULT_SETTINGS, type InvokerSettings } from 'ivkjs';

const STORAGE_KEY = 'invoker:env';

function loadSettings(): InvokerSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
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
  setActiveEnv: (index: number) => void;
  setVariable: (name: string, value: string) => void;
  addEnvironment: (name: string) => void;
  deleteEnvironment: (index: number) => void;
  persist: () => void;
}

export const useEnvStore = create<EnvState>((set, get) => {
  const settings = loadSettings();
  const envManager = new EnvManager(() => get().settings);
  envManager.setSaveCallback(async () => get().persist());

  return {
    settings,
    envManager,

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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(get().settings));
    },
  };
});
