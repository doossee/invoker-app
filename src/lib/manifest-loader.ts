import type { SiteManifest } from '@/types/site-config';

let cachedManifest: SiteManifest | null = null;

export async function loadManifest(baseUrl: string = '/'): Promise<SiteManifest> {
  if (cachedManifest) return cachedManifest;
  const url = `${baseUrl}manifest.json`.replace(/\/\//g, '/');
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load manifest: ${res.status}`);
  cachedManifest = (await res.json()) as SiteManifest;
  return cachedManifest;
}
