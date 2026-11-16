import { readFile } from "node:fs/promises";
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
        new URL(`../packages/${name}/package.json`, import.meta.url),
        "utf8",
      ),
    );

    expect(manifest.type).toBe("module");
    expect(manifest.engines.node).toBe(">=24.11.0");

    const exports = Object.entries(manifest.exports);
    expect(exports.length).toBeGreaterThan(0);
    for (const [subpath, entry] of exports) {
      expect(entry.types).toMatch(/^\.\/.*\.d\.ts$/);
      if (subpath === "./vite-client") {
        // Vite's ambient client declarations have no runtime entry point.
        expect(name).toBe("moyaforge-mdx");
        expect(entry).toEqual({ types: "./vite-client.d.ts" });
        continue;
      }
      expect(entry.import).toMatch(/^\.\/.*\.js$/);
      expect(entry.default).toBe(entry.import);
      expect(entry).not.toHaveProperty("require");
    }

    expect(manifest.main).toBe(manifest.exports["."].import);
    expect(manifest.types).toBe(manifest.exports["."].types);
  },
);
