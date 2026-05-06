import { useEnvStore } from '@/stores/env-store';

/**
 * Read-side hook for env variables. Surface tightened to remove
 * fields no caller consumes:
 *
 * - `allVars` — `envManager.getAllVariables()` was being called on
 *   every render of every component that mounts this hook (UrlBar,
 *   VarsTab, InlineIvkBlock, IvkBlock — typically 3+ instances at
 *   once). It returns a fresh `{ ...collectionVars, ...activeEnv,
 *   ...runtimeVars }` object each time. Zero callers actually read
 *   `allVars`, so it was pure dead work. Easy to add back lazily
 *   (`getAllVars()` function) if needed.
 *
 * - `settings` — every consumer of `useEnvStore.settings` already
 *   uses a proper selector (`useEnvStore(s => s.settings.foo)`),
 *   none reach into useEnv's exposed copy.
 *
 * Subscriptions still go through `useEnvStore()` (no selector) because
 * consumers need to re-render when the manager's internal `runtimeVars`
 * change — which only signals via the store's full-settings reference
 * being replaced.
 */
export function useEnv() {
  const store = useEnvStore();
  const activeEnv = store.settings.environments[store.settings.activeEnvironmentIndex];

  return {
    envManager: store.envManager,
    activeEnv,
    activeEnvIndex: store.settings.activeEnvironmentIndex,
    setActiveEnv: store.setActiveEnv,
    setVariable: store.setVariable,
    addEnvironment: store.addEnvironment,
    deleteEnvironment: store.deleteEnvironment,
    get: (name: string) => store.envManager.get(name),
    resolve: (text: string) => store.envManager.resolveVariables(text),
  };
}
