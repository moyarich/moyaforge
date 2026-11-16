import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { expect, test } from "vitest";

const publishablePackages = [
  "moyaforge",
  "moyaforge-cli",
  "moyaforge-mdx",
  "moyaforge-search-sqlite",
];

test.each(publishablePackages)(
  "%s publishes modern ESM entrypoints",
  async (name) => {
    const manifest = JSON.parse(
      await readFile(
        new URL(`../../packages/${name}/package.json`, import.meta.url),
        "utf8",
      ),
    );

    expect(manifest.type).toBe("module");
    expect(manifest.engines.node).toBe(">=24.11.0");

    const exports = Object.entries(manifest.exports);
    expect(exports.length).toBeGreaterThan(0);
    for (const [subpath, entry] of exports) {
      expect(entry.types).toMatch(/^\.\/.*\.d\.ts$/);
      expect(entry).not.toHaveProperty("require");

      if (entry.import === undefined) {
        // Ambient declarations may expose types without a JavaScript module.
        // Validate every type-only target from its manifest, not a fixed filename.
        expect(subpath).not.toBe(".");
        expect(entry).not.toHaveProperty("default");
        const typesPath = resolve(
          import.meta.dirname,
          "../../packages",
          name,
          entry.types,
        );
        expect(await readFile(typesPath, "utf8")).toContain("declare module");
        continue;
      }

      expect(entry.import).toMatch(/^\.\/.*\.js$/);
      expect(entry.default).toBe(entry.import);
    }

    expect(manifest.main).toBe(manifest.exports["."].import);
    expect(manifest.types).toBe(manifest.exports["."].types);
  },
);
