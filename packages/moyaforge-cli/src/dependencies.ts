import type { PackageManifest } from "./types.js";

type Deps = Record<string, string>;

const OPTIONAL_DEPENDENCIES = {
  package: { "@moyarich/moyaforge": "^0.1.0" },
  search: { "@moyarich/moyaforge-search-sqlite": "^0.1.0" },
} as const;

/** Add missing starter dependencies and scripts without changing consumer versions. */
export function mergeDependencies(
  manifest: PackageManifest,
  base: PackageManifest,
  template: "docs" | "hybrid" | "existing",
  mode: "source" | "package",
  search: boolean,
) {
  const existing = template === "existing";
  const prefix = existing ? "docs:" : "";
  const config = existing ? " --config moyaforge/vite.config.ts" : "";

  manifest.scripts ??= {};
  for (const action of ["dev", "build", "preview"]) {
    manifest.scripts[`${prefix}${action}`] ??= existing
      ? `vite${action === "dev" ? "" : ` ${action}`}${config}`
      : base.scripts?.[action] ?? `vite${action === "dev" ? "" : ` ${action}`}`;
  }
  manifest.scripts[`${prefix}typecheck`] ??= existing
    ? "tsc --noEmit -p moyaforge/tsconfig.json"
    : base.scripts?.typecheck ?? "tsc --noEmit -p tsconfig.json";

  const runtime: Deps = {
    ...base.dependencies,
    ...(mode === "package" && OPTIONAL_DEPENDENCIES.package),
    ...(search && OPTIONAL_DEPENDENCIES.search),
  };
  const development: Deps = { ...base.devDependencies };
  manifest.dependencies ??= {};
  manifest.devDependencies ??= {};

  for (const [target, required] of [
    [manifest.dependencies, runtime],
    [manifest.devDependencies, development],
  ] as const) {
    for (const [name, version] of Object.entries(required)) {
      if (manifest.dependencies[name] || manifest.devDependencies[name]) continue;
      const counterpart = name === "react" ? "react-dom"
        : name === "react-dom" ? "react" : "";
      target[name] = (counterpart &&
        (manifest.dependencies[counterpart] ?? manifest.devDependencies[counterpart])) || version;
    }
  }

  const specs = (deps: Deps) =>
    Object.entries(deps).map(([name, version]) => `${name}@${version}`);
  return { manifest, dependencies: [...specs(runtime), ...specs(development)] };
}
