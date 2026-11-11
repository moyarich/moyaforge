import type { PackageManifest } from "./types.js";

type Template = "docs" | "hybrid" | "existing";
type Mode = "source" | "package";
type Deps = Record<string, string>;

const MOYAFORGE_DEPENDENCIES = {
  "@moyarich/moyaforge": "^0.1.0",
  "@moyarich/moyaforge-search-sqlite": "^0.1.0",
} as const;

const SCRIPT_ACTIONS = ["dev", "build", "preview"] as const;

/** react and react-dom must stay on the same version line. */
const PEER_PAIRS: Record<string, string> = {
  react: "react-dom",
  "react-dom": "react",
};

const EXISTING_SCRIPT_PREFIX = "docs:";
const EXISTING_VITE_CONFIG = "--config moyaforge/vite.config.ts";
const EXISTING_TSC_COMMAND = "tsc --noEmit -p moyaforge/tsconfig.json";
const DEFAULT_TSC_COMMAND = "tsc --noEmit -p tsconfig.json";

function viteCommand(action: string, config?: string): string {
  // `vite` is the dev command; build/preview are subcommands.
  const subcommand = action === "dev" ? "" : action;
  return ["vite", subcommand, config].filter(Boolean).join(" ");
}

function addMissingScripts(
  manifest: PackageManifest,
  base: PackageManifest,
  template: Template,
): void {
  const isExisting = template === "existing";
  const prefix = isExisting ? EXISTING_SCRIPT_PREFIX : "";
  const scripts = (manifest.scripts ??= {});

  for (const action of SCRIPT_ACTIONS) {
    scripts[`${prefix}${action}`] ??= isExisting
      ? viteCommand(action, EXISTING_VITE_CONFIG)
      : base.scripts?.[action] ?? viteCommand(action);
  }

  scripts[`${prefix}typecheck`] ??= isExisting
    ? EXISTING_TSC_COMMAND
    : base.scripts?.typecheck ?? DEFAULT_TSC_COMMAND;
}

function toSpecs(entries: Deps): string[] {
  return Object.entries(entries).map(([name, version]) => `${name}@${version}`);
}

/**
 * Merge a template's required dependencies into a consumer package.
 * Existing versions, scripts and package metadata always take precedence.
 */
export function mergeDependencies(
  manifest: PackageManifest,
  base: PackageManifest,
  template: Template,
  mode: Mode,
  search: boolean,
) {
  addMissingScripts(manifest, base, template);

  const runtime: Deps = {
    ...base.dependencies,
    ...(mode === "package" && { "@moyarich/moyaforge": MOYAFORGE_DEPENDENCIES["@moyarich/moyaforge"] }),
    ...(search && { "@moyarich/moyaforge-search-sqlite": MOYAFORGE_DEPENDENCIES["@moyarich/moyaforge-search-sqlite"] }),
  };
  const development: Deps = { ...base.devDependencies };

  const dependencies = (manifest.dependencies ??= {});
  const devDependencies = (manifest.devDependencies ??= {});

  const installed = (name: string): string | undefined =>
    dependencies[name] ?? devDependencies[name];

  const addMissing = (target: Deps, entries: Deps) => {
    for (const [name, version] of Object.entries(entries)) {
      if (installed(name)) continue;
      const peer = PEER_PAIRS[name];
      target[name] = (peer && installed(peer)) || version;
    }
  };

  addMissing(dependencies, runtime);
  addMissing(devDependencies, development);

  return { manifest, dependencies: [...toSpecs(runtime), ...toSpecs(development)] };
}
