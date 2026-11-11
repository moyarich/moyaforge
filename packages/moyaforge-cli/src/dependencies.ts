import type { PackageManifest } from "./types.js";

/**
 * Merge a template's required dependencies into a consumer package.
 * Existing versions, scripts and package metadata always take precedence.
 */
export function mergeDependencies(
  manifest: PackageManifest,
  base: PackageManifest,
  template: "docs" | "hybrid" | "existing",
  mode: "source" | "package",
  search: boolean,
) {
  const prefix = template === "existing" ? "docs:" : "";
  const config = template === "existing" ? " --config moyaforge/vite.config.ts" : "";
  manifest.scripts ??= {};
  for (const action of ["dev", "build", "preview"])
    manifest.scripts[`${prefix}${action}`] ??=
      template === "existing"
        ? `vite ${action === "dev" ? "" : action}${config}`.trim()
        : base.scripts?.[action] ?? `vite ${action === "dev" ? "" : action}`.trim();
  manifest.scripts[`${prefix}typecheck`] ??=
    template === "existing"
      ? "tsc --noEmit -p moyaforge/tsconfig.json"
      : base.scripts?.typecheck ?? "tsc --noEmit -p tsconfig.json";

  const runtime = {
    ...base.dependencies,
    ...(mode === "package" ? { "@moyarich/moyaforge": "^0.1.0" } : {}),
    ...(search ? { "@moyarich/moyaforge-search-sqlite": "^0.1.0" } : {}),
  };
  const development = { ...base.devDependencies };
  manifest.dependencies ??= {};
  manifest.devDependencies ??= {};

  for (const [entries, key] of [
    [runtime, "dependencies"],
    [development, "devDependencies"],
  ] as const) {
    for (const [name, version] of Object.entries(entries)) {
      if (manifest.dependencies[name] || manifest.devDependencies[name]) continue;
      const counterpart = name === "react-dom" ? "react"
        : name === "react" ? "react-dom" : null;
      manifest[key]![name] = counterpart
        ? manifest.dependencies[counterpart] ?? manifest.devDependencies[counterpart] ?? version
        : version;
    }
  }

  const specs = (entries: Record<string, string> | undefined) =>
    Object.entries(entries ?? {}).map(([name, version]) => `${name}@${version}`);
  return { manifest, dependencies: [...specs(runtime), ...specs(development)] };
}
