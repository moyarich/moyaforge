/** Source definitions shared by playground content discovery and Vite watching. */
export default {
  sources: {
    docs: {
      base: "../../docs",
      include: ["**/*.md", "**/page.mdx"],
      navigation: { label: "Docs", order: 1 },
    },
    packages: {
      base: "../../packages",
      include: ["*/**/page.mdx"],
      metadata: ["*/package.json"],
      navigation: { label: "Packages", order: 2 },
    },
  },
} as const;
