import type { RegistryConfiguration } from "@moyarich/moyaforge-mdx/vite";

/** Files and folders loaded by the shell. Paths are relative to apps/playground. */
export default {
  sources: {
    docs: {
      base: "../../docs",
      include: ["**/*.{md,mdx}"],
      pageFiles: "all",
      // Keep standalone developer .md pages, but not repository README files.
      exclude: ["**/{README,readme}.{md,mdx}"],
      navigation: { label: "Guide", order: 1 },
    },
    ui: {
      base: "../../packages/moyaforge-ui/docs",
      include: ["**/page.{md,mdx}"],
      pageFiles: "all",
      navigation: { label: "UI Components", order: 2 },
    },
    packages: {
      base: "../../packages",
      // Package README files remain available on GitHub/npm, not as docs routes.
      include: ["**/page.{md,mdx}"],
      pageFiles: "all",
      exclude: [
        "**/node_modules/**",
        "**/dist/**",
        "moyaforge-ui/docs/**",
        "moyaforge-cli/templates/**",
      ],
      metadata: ["*/package.json"],
      navigation: { label: "Packages", order: 2 },
    },
  },
} as const satisfies RegistryConfiguration;
