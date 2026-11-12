import type { RegistryConfiguration } from "@moyarich/moyaforge-mdx/vite";

/** Content belongs to the generated application, not to the MoyaForge repository. */
export default {
  sources: {
    docs: {
      base: "docs",
      include: ["**/*.md", "**/*.mdx"],
      pageFiles: "all",
      navigation: { label: "Guide", order: 1 },
    },
  },
} as const satisfies RegistryConfiguration;
