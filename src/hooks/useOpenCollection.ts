import { useCallback, useState } from 'react';
import {
  openCollectionDialog,
  loadCollection,
  openCollectionFromBrowser,
  hasBrowserFolderApi,
} from '@/lib/file-system';
import { useCollectionStore } from '@/stores/collection-store';
import { useDocsStore } from '@/stores/docs-store';
import { isTauri } from '@/lib/platform';
import { sampleCollection } from '@/data/sample-collection';
import { sampleDocs } from '@/data/sample-docs';

export function useOpenCollection() {
  const [loading, setLoading] = useState(false);
  // Select specific action slices (stable refs) instead of subscribing to the
  // whole store — avoids re-render churn AND keeps a constant hook count.
  const loadCollectionToStore = useCollectionStore((s) => s.loadCollection);
  const setCollectionPath = useCollectionStore((s) => s.setCollectionPath);
  const loadDocsToStore = useDocsStore((s) => s.loadDocs);

  const isTauriApp = isTauri();
  const hasBrowserApi = hasBrowserFolderApi();
  // A user-facing "Choose folder" action is possible if EITHER runtime path
  // is available: native Tauri dialog, or the File System Access API.
  const canOpenFolder = isTauriApp || hasBrowserApi;

  const openCollection = useCallback(async () => {
    console.info('[invoker] openCollection invoked', { isTauriApp, hasBrowserApi });
    setLoading(true);
    try {
      if (isTauriApp) {
        const folderPath = await openCollectionDialog();
        if (!folderPath) return;
        const data = await loadCollection(folderPath);
        loadCollectionToStore({ ivkFiles: data.ivkFiles, basePath: data.basePath });
        setCollectionPath(folderPath);
        loadDocsToStore(data.mdFiles);
        return;
      }
      if (hasBrowserApi) {
        console.info('[invoker] launching browser folder picker…');
        const data = await openCollectionFromBrowser();
        if (!data) {
          console.info('[invoker] picker returned no data (cancelled or unsupported)');
          return;
        }
        if (data.ivkFiles.length === 0 && data.mdFiles.length === 0) {
          // eslint-disable-next-line no-alert
          window.alert(
            `No .ivk or .md files found in "${data.basePath}".\n\n` +
              `Invoker scans recursively for files ending in .ivk (requests) ` +
              `and .md (docs). Make sure the folder (or one of its subfolders) ` +
              `contains at least one of those.\n\n` +
              `Open DevTools → Console for any read errors.`,
          );
          return;
        }
        console.info('[invoker] loading into store…', { basePath: data.basePath, ivk: data.ivkFiles.length, md: data.mdFiles.length });
        loadCollectionToStore({ ivkFiles: data.ivkFiles, basePath: data.basePath });
        setCollectionPath(data.basePath);
        loadDocsToStore(data.mdFiles);
        return;
      }
      // Neither Tauri nor FSA — show a clear message rather than failing silently.
      // eslint-disable-next-line no-alert
      window.alert(
        'Folder picker is not available in this browser.\n\n' +
          'Use Chrome, Edge, or Opera to open a local folder, or click ' +
          '"Try sample" to load the bundled demo collection.',
      );
    } catch (e) {
      console.error('[invoker] openCollection failed:', e);
      // eslint-disable-next-line no-alert
      window.alert(`Failed to open folder: ${(e as Error)?.message ?? String(e)}`);
    } finally {
      setLoading(false);
    }
  }, [loadCollectionToStore, setCollectionPath, loadDocsToStore, isTauriApp, hasBrowserApi]);

  /**
   * Load the bundled sample collection. Used as a fallback on browsers that
   * don't support the File System Access API (Safari, Firefox) and as a quick
   * "see it work" action on first-run.
   */
  const loadSample = useCallback(() => {
    loadCollectionToStore({ ivkFiles: sampleCollection, basePath: '(sample)' });
    setCollectionPath('(sample)');
    loadDocsToStore(sampleDocs);
  }, [loadCollectionToStore, setCollectionPath, loadDocsToStore]);

  return { openCollection, loadSample, loading, canOpenFolder, isTauriApp, hasBrowserApi };
}
