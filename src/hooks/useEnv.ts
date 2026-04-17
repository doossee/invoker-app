import { useEnvStore } from '@/stores/env-store';

export function useEnv() {
  const store = useEnvStore();
  const activeEnv = store.settings.environments[store.settings.activeEnvironmentIndex];

  return {
    envManager: store.envManager,
    settings: store.settings,
    activeEnv,
    activeEnvIndex: store.settings.activeEnvironmentIndex,
    setActiveEnv: store.setActiveEnv,
    setVariable: store.setVariable,
    addEnvironment: store.addEnvironment,
    deleteEnvironment: store.deleteEnvironment,
    allVars: store.envManager.getAllVariables(),
    get: (name: string) => store.envManager.get(name),
    resolve: (text: string) => store.envManager.resolveVariables(text),
  };
}
