import { execFileSync } from "node:child_process";
import { readdir, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const executable = resolve(root, "github-cli/dist/bin/moyaforge.js");
const templateRoot = resolve(root, "github-cli/templates");
await stat(executable);
if (!(await readdir(templateRoot)).includes("base")) {
  throw new Error("GitHub CLI package is missing base templates");
}

// Check that the bundled CLI actually starts without depending on the workspace.
const help = execFileSync(process.execPath, [executable, "--help"], {
  cwd: root,
  encoding: "utf8",
});
if (!help.includes("moyaforge")) {
  throw new Error("GitHub CLI executable did not produce expected help");
}

// npm's published file list is the authoritative check that the generated
// distribution is included in a Git dependency tarball.
const pack = JSON.parse(
  execFileSync("npm", ["pack", "--dry-run", "--json", "--ignore-scripts"], {
    cwd: root,
    encoding: "utf8",
  }),
);
const files = new Set(pack[0]?.files?.map((file) => file.path));
if (!files.has("github-cli/dist/bin/moyaforge.js")) {
  throw new Error("GitHub CLI executable is missing from npm pack");
}
if (![...files].some((file) => file.startsWith("github-cli/templates/base/"))) {
  throw new Error("GitHub CLI templates are missing from npm pack");
}
console.log("GitHub-root CLI bundle and npm package verified");
