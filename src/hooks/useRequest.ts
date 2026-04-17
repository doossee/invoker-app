import { useState, useCallback } from 'react';
import { RequestRunner, type IvkRequest, type RunResult } from 'ivkjs';
import { transport } from '@/lib/transport';
import { useEnvStore } from '@/stores/env-store';
import { useEditorStore } from '@/stores/editor-store';

export function useRequest(filePath: string | null) {
  const envManager = useEnvStore((s) => s.envManager);
  const cacheResponse = useEditorStore((s) => s.cacheResponse);
  const getResponse = useEditorStore((s) => s.getResponse);

  const [loading, setLoading] = useState(false);

  const cachedResult = filePath ? getResponse(filePath) : undefined;

  const run = useCallback(
    async (request: IvkRequest): Promise<RunResult> => {
      setLoading(true);
      try {
        const runner = new RequestRunner(envManager, transport);
        const result = await runner.run(request);
        if (filePath) cacheResponse(filePath, result);
        return result;
      } finally {
        setLoading(false);
      }
    },
    [envManager, filePath, cacheResponse],
  );

  return {
    run,
    loading,
    result: cachedResult ?? null,
  };
}
