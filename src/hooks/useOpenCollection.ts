import { useCallback, useState } from 'react';
import { openCollectionDialog, loadCollection } from '@/lib/file-system';
import { useCollectionStore } from '@/stores/collection-store';
import { useDocsStore } from '@/stores/docs-store';
import { isTauri } from '@/lib/platform';

export function useOpenCollection() {
  const [loading, setLoading] = useState(false);
  const store = useCollectionStore();
  const docsStore = useDocsStore();

  const openCollection = useCallback(async () => {
    if (!isTauri()) return;
    setLoading(true);
    try {
      const folderPath = await openCollectionDialog();
      if (!folderPath) { setLoading(false); return; }
      const data = await loadCollection(folderPath);
      store.loadCollection({ ivkFiles: data.ivkFiles, basePath: data.basePath });
      store.setCollectionPath(folderPath);
      docsStore.loadDocs(data.mdFiles);
    } finally {
      setLoading(false);
    }
  }, [store, docsStore]);

  return { openCollection, loading, isTauriApp: isTauri() };
}
