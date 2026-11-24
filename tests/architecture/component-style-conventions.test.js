import { globSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

const root = resolve(import.meta.dirname, "../..");

describe("component style conventions", () => {
  const stylesheets = globSync("**/*.css", {
    cwd: root,
    exclude: ["**/node_modules/**", "**/dist/**", "**/coverage/**"],
  });

  test("all repository stylesheets use classes rather than data attributes", () => {
    expect(stylesheets.length).toBeGreaterThan(0);
    const violations = stylesheets.flatMap((path) => {
      const css = readFileSync(resolve(root, path), "utf8");
      const selectors = css.match(/\[[^\]\r\n]*\bdata-[\w-]+[^\]\r\n]*\]/g) ?? [];
      return selectors.map((selector) => path + ": " + selector);
    });
    expect(violations).toEqual([]);
  });

  test("public/shared CSS variables use --mf-* and private variables use --_mf-*", () => {
    const violations = stylesheets.flatMap((path) => {
      const css = readFileSync(resolve(root, path), "utf8");
      // Vendor-owned Shiki --shiki-* inputs must remain compatible.
      const names = css.match(/(?<![\w-])--_?[A-Za-z][\w-]*/g) ?? [];
      return names
        .filter((name) => !/^--(?:_?mf-|shiki-|tw-)/.test(name))
        .map((name) => path + ": " + name);
    });
    expect(violations).toEqual([]);
  });
});
