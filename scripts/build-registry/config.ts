import type { BuildRegistryOptions } from "./build-registry.ts";

/** Typed, runner-independent configuration for the component registry. */
export function defineRegistryConfig<T extends BuildRegistryOptions>(config: T): T {
  return config;
}
