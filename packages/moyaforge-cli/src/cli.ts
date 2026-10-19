import { usage } from "./commands/usage.js";
import type { InstallPlan } from "./types.js";
import type { ScaffoldOptions } from "./scaffold.js";
import { parseArgs } from "node:util";
import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import {
  applyPlan,
  defaultRegistry,
  defaultDirectory,
  installDependencies,
  loadRegistry,
  planItems,
  readOptional,
  reportPlan,
} from "./registry.js";
import { planProject } from "./scaffold.js";

/** Dispatch CLI commands, preserving host files unless replacement is explicit. */
export async function main() {
  const [command, ...args] = process.argv.slice(2);
  if (["--version", "-v"].includes(command)) {
    console.log(
      JSON.parse(
        (await readOptional(new URL("../package.json", import.meta.url)))!,
      ).version,
    );
    return;
  }
  if (!command || ["--help", "-h", "help"].includes(command)) {
    console.log(usage);
    return;
  }
  if (["dev", "build", "preview"].includes(command)) {
    const at = args.indexOf("--cwd");
    const root = resolve(at >= 0 ? (args[at + 1] ?? ".") : ".");
    const forwarded =
      at >= 0
        ? args.filter((_, index) => index !== at && index !== at + 1)
        : args;
    const vite = resolve(
      root,
      "node_modules/.bin",
      process.platform === "win32" ? "vite.cmd" : "vite",
    );
    if (!existsSync(vite))
      throw Error(
        "Vite is not installed. Run npm install in the consumer project.",
      );
    const config =
      !forwarded.includes("--config") &&
      existsSync(resolve(root, "moyaforge/vite.config.ts"))
        ? ["--config", "moyaforge/vite.config.ts"]
        : [];
    const result = spawnSync(
      vite,
      [...(command === "dev" ? [] : [command]), ...config, ...forwarded],
      { cwd: root, stdio: "inherit", shell: process.platform === "win32" },
    );
    if (result.error) throw result.error;
    process.exitCode = result.status ?? 1;
    return;
  }
  if (!["init", "add", "list"].includes(command))
    throw Error(`Unknown command: ${command}`);
  const { values, positionals } = parseArgs({
    args,
    allowPositionals: true,
    options: {
      cwd: { type: "string" },
      registry: { type: "string" },
      directory: { type: "string" },
      mode: { type: "string" },
      template: { type: "string" },
      search: { type: "boolean" },
      "dry-run": { type: "boolean" },
      diff: { type: "boolean" },
      overwrite: { type: "boolean" },
      "no-install": { type: "boolean" },
      help: { type: "boolean", short: "h" },
    },
  });
  if (values.help) {
    console.log(usage);
    return;
  }
  const root = resolve(values.cwd ?? ".");
  if (!existsSync(root))
    throw Error(`Project directory does not exist: ${root}`);
  const config = JSON.parse(
    (await readOptional(resolve(root, "moyaforge.components.json"))) ?? "{}",
  );
  const selectedRegistry =
    values.registry ?? config.registry ?? defaultRegistry;
  const registry = /^https?:\/\//.test(selectedRegistry)
    ? selectedRegistry
    : resolve(values.registry ? process.cwd() : root, selectedRegistry);
  const directory = values.directory ?? config.directory ?? defaultDirectory;
  if (typeof registry !== "string" || typeof directory !== "string")
    throw Error(
      "Invalid moyaforge.components.json: registry and directory must be strings",
    );
  if (command === "list" || (command === "add" && !positionals.length)) {
    const { registry: source } = await loadRegistry(registry);
    for (const item of source.items)
      console.log(`${item.name}: ${item.description ?? item.title ?? ""}`);
    return;
  }
  const options = { root, names: positionals, registry, directory };
  let plan: InstallPlan;
  if (command === "init") {
    const mode = values.mode ?? "source";
    const project = await planProject({
      ...options,
      mode: mode as ScaffoldOptions["mode"],
      template: values.template as ScaffoldOptions["template"],
      search: values.search,
    });
    const components = await planItems({
      ...options,
      names: ["docs-shell", "code-group"],
    });
    plan = {
      files: [...components.files, ...project.files],
      dependencies: project.dependencies,
      instructions: components.instructions,
    };
  } else plan = await planItems(options);
  reportPlan(plan, { root, diff: values.diff, overwrite: values.overwrite });
  const printSetupNotes = () => {
    if (plan.instructions?.length)
      console.log(`\nSetup notes:\n\n${plan.instructions.join("\n\n")}`);
  };
  if (values["dry-run"]) {
    printSetupNotes();
    console.log("Dry run: no files or dependencies changed.");
    return;
  }
  if (
    !existsSync(resolve(root, "package.json")) &&
    command !== "init" &&
    !values["no-install"]
  )
    throw Error(
      "No package.json found. Run init first, or use --no-install to copy source only.",
    );
  await applyPlan(plan, { root, overwrite: values.overwrite });
  if (!values["no-install"]) {
    if (command === "init") installDependencies(root, [], false, true);
    else {
      const manifest = JSON.parse(
        (await readOptional(resolve(root, "package.json"))) ?? "{}",
      );
      const declared = {
        ...manifest.dependencies,
        ...manifest.devDependencies,
        ...manifest.peerDependencies,
      };
      const missing = plan.dependencies.filter(
        (spec) => !declared[spec.replace(/@[^@/]+$/, "")],
      );
      installDependencies(root, missing);
    }
  }
  console.log(
    command === "init"
      ? "MoyaForge app created. Run npm install if skipped, then npm run dev (or npm run docs:dev for an existing app)."
      : "Components installed. Import the component source; styles are loaded automatically.",
  );
  printSetupNotes();
}
