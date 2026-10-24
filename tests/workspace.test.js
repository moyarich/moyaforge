import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";
import { test } from "vitest";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifests = Object.fromEntries(
  await Promise.all(
    [
      "moyaforge",
      "moyaforge-mdx",
      "moyaforge-search-sqlite",
      "moyaforge-cli",
    ].map(async (name) => [
      name,
      JSON.parse(
        await readFile(resolve(root, "packages", name, "package.json"), "utf8"),
      ),
    ]),
  ),
);

const allDeps = (manifest) => ({
  ...manifest.dependencies,
  ...manifest.devDependencies,
  ...manifest.peerDependencies,
  ...manifest.optionalDependencies,
});

test("headless packages remain UI independent and search consumes MDX metadata one-way", () => {
  for (const name of ["moyaforge-mdx", "moyaforge-search-sqlite"]) {
    const dependencies = allDeps(manifests[name]);
    assert.equal(dependencies["@moyarich/moyaforge"], undefined, name);
    assert.equal(dependencies["@moyarich/console"], undefined, name);
    assert.equal(dependencies.react, undefined, name);
  }
  assert.equal(
    allDeps(manifests["moyaforge-search-sqlite"])["@moyarich/moyaforge-mdx"],
    manifests["moyaforge-mdx"].version,
  );
  assert.equal(
    allDeps(manifests["moyaforge-mdx"])["@moyarich/moyaforge-search-sqlite"],
    undefined,
  );
});

test("published package export targets and command entry points exist after builds", async () => {
  for (const [name, manifest] of Object.entries(manifests)) {
    const entries = Object.values(manifest.exports ?? {}).flatMap((value) =>
      typeof value === "string" ? [value] : Object.values(value),
    );
    const bins =
      typeof manifest.bin === "string"
        ? [manifest.bin]
        : Object.values(manifest.bin ?? {});
    for (const target of [...entries, ...bins]) {
      const location = resolve(root, "packages", name, target);
      assert.ok(
        location.startsWith(resolve(root, "packages", name) + "/"),
        target,
      );
      const file = await stat(location);
      assert.ok(file.isFile(), `${name}: missing published entry ${target}`);
    }
  }
});

test("installer ownership and optional editor peers stay outside basic UI installs", () => {
  assert.equal(manifests.moyaforge.bin, undefined);
  assert.equal(
    manifests["moyaforge-cli"].bin.moyaforge,
    "./dist/bin/moyaforge.js",
  );
  assert.equal(manifests["moyaforge-cli"].dependencies, undefined);
  for (const name of [
    "@monaco-editor/react",
    "@typefox/monaco-editor-react",
    "monaco-languageclient",
    "@moyarich/console",
    "@mdx-js/react",
  ]) {
    assert.equal(allDeps(manifests.moyaforge)[name], undefined, name);
  }
});
