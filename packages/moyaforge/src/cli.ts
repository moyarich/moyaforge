#!/usr/bin/env node
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const [, , command, ...args] = process.argv;
const cwd = process.cwd();

function init() {
  const docs = resolve(cwd, "docs");
  const firstPage = join(docs, "page.mdx");
  const config = resolve(cwd, "moyaforge.config.ts");
  mkdirSync(docs, { recursive: true });
  if (!existsSync(firstPage)) writeFileSync(firstPage, "---\ntitle: Welcome\n---\n\n# Welcome\n\nYour documentation starts here.\n");
  if (!existsSync(config)) writeFileSync(config, 'import { defineMoyaForgeConfig } from "@moyarich/moyaforge";\n\nexport default defineMoyaForgeConfig({ mode: "docs", content: { docs: "docs" } });\n');
  console.log("Created docs/page.mdx and moyaforge.config.ts (existing files preserved).");
  console.log("Configure a Vite React app with @moyarich/moyaforge/vite and an MDX compiler to render the content.");
}
function runVite(action: string) {
  const vite = resolve(cwd, "node_modules", ".bin", process.platform === "win32" ? "vite.cmd" : "vite");
  if (!existsSync(vite)) {
    console.error("Vite is not installed in this project. Add vite, @vitejs/plugin-react, and an MDX Vite plugin.");
    process.exitCode = 1;
    return;
  }
  const result = spawnSync(vite, [action, ...args], { cwd, stdio: "inherit", shell: process.platform === "win32" });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
}
switch (command) {
  case "init": init(); break;
  case "dev": runVite("--host" === args[0] ? "dev" : "dev"); break;
  case "build": runVite("build"); break;
  case "preview": runVite("preview"); break;
  default:
    console.log("Usage: moyaforge <init|dev|build|preview> [vite options]");
    if (command && !["--help", "-h"].includes(command)) process.exitCode = 1;
}
