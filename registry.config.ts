import { defineRegistryConfig } from "./scripts/build-registry/config.ts";

export default defineRegistryConfig({
  name: "moyaforge",
  homepage: "https://github.com/moyarich/moyaforge",
  packages: [
    { packagePath: "packages/moyaforge-ui" },
    {
      packagePath: "packages/moyaforge-monaco",
      nameOverrides: { MonacoEditorTypeFox: "monaco-editor-typefox" },
    },
  ],
  dependencyManifests: ["packages/moyaforge/package.json"],
  templatesDir: false,
  docsDir: false,
  outputFile: "registry.json",
  targetDir: "~/src/components/ui",
  legacyStylesDir: "registry/styles",
});
