import type { StaticPublicationOptions } from "../../content/static-publication.js";
import type {
  ContentSourcesConfig,
  createContentDiscovery,
} from "../../content/discovery.js";

export interface RegistrySource {
  base: string;
  include: readonly string[];
  /** Include ordinary Markdown files in addition to directory landing pages. */
  pageFiles?: "canonical" | "all";
  exclude?: readonly string[];
  navigation?: { label?: string; order?: number };
  metadata?: readonly string[];
}

export interface RegistryConfiguration extends ContentSourcesConfig {
  sources: Record<string, RegistrySource>;
}

export interface RegistryPluginOptions {
  registry: RegistryConfiguration;
  root: string;
  /** Repository root for generated GitHub edit paths; discovered from .git when omitted. */
  repositoryRoot?: string;
  /** Optional discovery cache shared with other build-time consumers. */
  discovery?: ReturnType<typeof createContentDiscovery>;
  /** Opt-in deterministic publication assets emitted by Vite at build time. */
  publication?: StaticPublicationOptions;
}
