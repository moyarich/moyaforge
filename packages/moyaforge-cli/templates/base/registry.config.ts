export default {
  sources: { docs: { base: "__DOCS_BASE__", include: ["**/*.md", "**/*.mdx"], pageFiles: "all", exclude: ["**/README.md", "**/readme.md", "**/README.mdx", "**/readme.mdx"], navigation: { label: "Guide", order: 1 } } }
} as const;
