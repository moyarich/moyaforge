import { Command, Option } from "commander";
import type { InstallPlan } from "./types.js";
import type { ScaffoldOptions } from "./scaffold.js";
import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import {
  applyPlan, defaultRegistry, defaultDirectory, installDependencies,
  loadRegistry, planItems, readOptional, reportPlan,
} from "./registry.js";
import { planConfiguration, planProject } from "./scaffold.js";

interface InstallOptions {
  cwd?: string;
  registry?: string;
  directory?: string;
  mode?: "source" | "package";
  template?: "docs" | "hybrid" | "existing";
  search?: boolean;
  dryRun?: boolean;
  diff?: boolean;
  overwrite?: boolean;
  noInstall?: boolean;
}

async function runVite(command: "dev" | "build" | "preview", args: string[]) {
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

}

/** Apply one command's plan without coupling its execution to argument parsing. */
async function runInstall(command: "init" | "create" | "add" | "list", values: InstallOptions, positionals: string[]) {
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
  const createsProject = command === "create" || (command === "init" && (values.template !== undefined || values.mode !== undefined || values.search));
  if (createsProject) {
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
  } else if (command === "init") plan = await planConfiguration(options);
  else plan = await planItems(options);
  reportPlan(plan, { root, diff: values.diff, overwrite: values.overwrite });
  const printSetupNotes = () => {
    if (plan.instructions?.length)
      console.log(`\nSetup notes:\n\n${plan.instructions.join("\n\n")}`);
  };
  if (values.dryRun) {
    printSetupNotes();
    console.log("Dry run: no files or dependencies changed.");
    return;
  }
  if (
    !existsSync(resolve(root, "package.json")) &&
    !["init", "create"].includes(command) &&
    !values.noInstall
  )
    throw Error(
      "No package.json found. Run init first, or use --no-install to copy source only.",
    );
  await applyPlan(plan, { root, overwrite: values.overwrite });
  if (!values.noInstall) {
    if (createsProject) installDependencies(root, [], false, true);
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
    createsProject
      ? "MoyaForge app created. Run npm install if skipped, then npm run dev (or npm run docs:dev for an existing app)."
      : command === "init" ? "MoyaForge configured. Use moyaforge add to install components." : "Components installed. Import the component source; styles are loaded automatically.",
  );
  printSetupNotes();
}

/** Use Commander for command routing, options, validation and help output. */
export async function main(argv: string[] = process.argv) {
  const metadata = JSON.parse((await readOptional(new URL("../package.json", import.meta.url)))!);
  const program = new Command()
    .name("moyaforge")
    .description("Create MoyaForge documentation sites and install editable components.")
    .version(metadata.version, "-v, --version");

  function options(name: "init" | "create" | "add" | "list", description: string) {
    return program.command(name)
      .description(description)
      .option("--cwd <path>", "Consumer project directory")
      .option("--registry <source>", "Local registry directory or registry.json URL")
      .option("--directory <path>", "Component installation directory")
      .addOption(new Option("--mode <mode>", "Source or npm-managed UI").choices(["source", "package"]))
      .addOption(new Option("--template <template>", "Documentation starter template").choices(["docs", "hybrid", "existing"]))
      .option("--search", "Include the SQLite search adapter")
      .option("--dry-run", "Show the installation plan without writing")
      .option("--diff", "Print a diff of proposed changes")
      .option("--overwrite", "Replace existing generated files")
      .option("--no-install", "Skip npm dependency installation");
  }
  options("init", "Configure a project; legacy template flags create a site")
    .action(async (_opts: InstallOptions, command: Command) => {
      await runInstall("init", command.opts<InstallOptions>(), []);
    });
  options("create", "Generate a React/Vite/MDX documentation site")
    .action(async (_opts: InstallOptions, command: Command) => {
      await runInstall("create", command.opts<InstallOptions>(), []);
    });
  options("add", "Install editable registry components")
    .argument("[items...]", "Registry item names")
    .action(async (names: string[], _opts: InstallOptions, command: Command) => {
      await runInstall("add", command.opts<InstallOptions>(), names);
    });
  options("list", "List available registry components")
    .action(async (_opts: InstallOptions, command: Command) => {
      await runInstall("list", command.opts<InstallOptions>(), []);
    });
  for (const action of ["dev", "build", "preview"] as const) {
    program.command(action)
      .description(`Run Vite ${action} in the consumer project`)
      .allowUnknownOption(true)
      .argument("[args...]", "Additional Vite options")
      .option("--cwd <path>", "Consumer project directory")
      .action(async (_forwarded: string[], opts: { cwd?: string }) => {
        const args = argv.slice(2);
        const commandAt = args.indexOf(action);
        await runVite(action, args.slice(commandAt + 1));
      });
  }
  await program.parseAsync(argv);
}
