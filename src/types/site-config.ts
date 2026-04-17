export interface SiteConfig {
  title: string;
  description?: string;
  baseUrl?: string;
  favicon?: string;
  defaults?: Record<string, string>;
  nav?: {
    logo?: string;
    links?: Array<{ label: string; href: string }>;
  };
}

export interface SiteManifest {
  config: SiteConfig;
  ivkFiles: Array<{ path: string; name: string; content: string }>;
  mdFiles: Array<{ path: string; title: string; content: string }>;
}
