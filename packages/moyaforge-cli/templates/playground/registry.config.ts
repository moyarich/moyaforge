import type { RegistryConfiguration } from "@moyarich/moyaforge-mdx/vite";

/** Content belongs to the generated application, not to the MoyaForge repository. */
export default {
  sources: {
    docs: {
      base: "docs",
      include: ["**/*.md", "**/*.mdx"],
      pageFiles: "all",
      exclude: ["**/README.md", "**/readme.md", "**/README.mdx", "**/readme.mdx"],
      navigation: { label: "Guide", order: 1 },
    },
  },
} as const satisfies RegistryConfiguration;
