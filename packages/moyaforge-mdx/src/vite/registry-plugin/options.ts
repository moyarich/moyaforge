import type { StaticPublicationOptions } from "../../content/static-publication.js";
import type {
  ContentSourcesConfig,
  createContentDiscovery,
} from "../../content/discovery.js";

/** Discovery and navigation settings for a single documentation source. */
export interface RegistrySource {
  /** Source directory, resolved relative to the application root. */
  base: string;
  /** Tinyglobby patterns; supports brace expansion. */
  include: readonly string[];
  /** Include ordinary Markdown files in addition to directory landing pages. */
  pageFiles?: "canonical" | "all";
  /** Tinyglobby ignore patterns; supports brace expansion. */
  exclude?: readonly string[];
  navigation?: { label?: string; order?: number };
  metadata?: readonly string[];
}

/** Content discovery configuration keyed by source identifier. */
export interface RegistryConfiguration extends ContentSourcesConfig {
  /** Named documentation sources and their discovery settings. */
  sources: Record<string, RegistrySource>;
}

/** Configuration for the Vite MDX registry plugin. */
export interface RegistryPluginOptions {
  /** Sources and registry settings used to discover documentation pages. */
  registry: RegistryConfiguration;
  /** Application root used to resolve relative source and repository paths. */
  root: string;
  /** Repository root for generated GitHub edit paths; discovered from .git when omitted. */
  repositoryRoot?: string;
  /** Optional discovery cache shared with other build-time consumers. */
  discovery?: ReturnType<typeof createContentDiscovery>;
  /** Opt-in deterministic publication assets emitted by Vite at build time. */
  publication?: StaticPublicationOptions;
}
