import type { PackageManifest } from "./types.js";
export const runtime = [
  "react@^19.0.0",
  "react-dom@^19.0.0",
  "react-router-dom@^7.18.4",
  "@mdx-js/react@^3.1.1",
  "@moyarich/moyaforge-mdx@^0.1.0",
  "lucide-react@^1.56.0",
];
export const development = [
  "vite@^8.3.4",
  "@vitejs/plugin-react@^6.1.2",
  "@mdx-js/rollup@^3.1.1",
  "@shikijs/rehype@^4.0.0",
  "typescript@^7.0.2",
  "@types/react@^19.0.0",
  "@types/react-dom@^19.0.0",
  "@types/node@^26.0.0",
];

export function mergeDependencies(manifest: PackageManifest, template: "docs" | "hybrid" | "existing", mode: "source" | "package", search: boolean) {
  const prefix = template === "existing" ? "docs:" : "";
  const config =
    template === "existing" ? " --config moyaforge/vite.config.ts" : "";
  manifest.scripts ??= {};
  for (const action of ["dev", "build", "preview"])
    manifest.scripts[`${prefix}${action}`] ??=
      `vite ${action === "dev" ? "" : action}${config}`.trim();
  manifest.scripts[`${prefix}typecheck`] ??=
    `tsc --noEmit -p ${template === "existing" ? "moyaforge/tsconfig.json" : "tsconfig.json"}`;
  const deps = [
    ...runtime,
    ...(mode === "package" ? ["@moyarich/moyaforge@^0.1.0"] : []),
    ...(search ? ["@moyarich/moyaforge-search-sqlite@^0.1.0"] : []),
  ];
  // Preserve host versions and scripts; install only missing dependencies.
  manifest.dependencies ??= {};
  manifest.devDependencies ??= {};
  for (const [list, key] of [
    [deps, "dependencies"],
    [development, "devDependencies"],
  ] as const)
    for (const spec of list) {
      const at = spec.lastIndexOf("@");
      const name = spec.slice(0, at);
      const version = spec.slice(at + 1);
      if (!manifest.dependencies[name] && !manifest.devDependencies[name]) {
        const counterpart =
          name === "react-dom"
            ? "react"
            : name === "react"
              ? "react-dom"
              : null;
        manifest[key]![name] = counterpart
          ? (manifest.dependencies[counterpart] ??
            manifest.devDependencies[counterpart] ??
            version)
          : version;
      }
    }

  return { manifest, dependencies: [...deps, ...development] };
}
