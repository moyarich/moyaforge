import { chmod } from "node:fs/promises";
import { builtinModules } from "node:module";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

/** Build Node entry points without relocating their package-relative assets. */
export default defineConfig({
  plugins: [
    {
      name: "executable-cli",
      generateBundle(_options, bundle) {
        const cli = bundle["bin/moyaforge.js"];
        if (cli?.type === "chunk" && !cli.code.startsWith("#!"))
          cli.code = `#!/usr/bin/env node\n${cli.code}`;
      },
      async writeBundle() {
        await chmod(
          fileURLToPath(new URL("./dist/bin/moyaforge.js", import.meta.url)),
          0o755,
        );
      },
    },
  ],
  build: {
    ssr: true,
    target: "node22",
    minify: false,
    copyPublicDir: false,
    lib: {
      entry: {
        "bin/moyaforge": fileURLToPath(
          new URL("./src/bin/moyaforge.ts", import.meta.url),
        ),
        "commands/usage": fileURLToPath(
          new URL("./src/commands/usage.ts", import.meta.url),
        ),
        cli: fileURLToPath(new URL("./src/cli.ts", import.meta.url)),
        registry: fileURLToPath(new URL("./src/registry.ts", import.meta.url)),
        scaffold: fileURLToPath(new URL("./src/scaffold.ts", import.meta.url)),
      },
      formats: ["es"],
      fileName: (_format, name) => `${name}.js`,
    },
    rolldownOptions: {
      external: [
        ...builtinModules,
        ...builtinModules.map((name) => `node:${name}`),
      ],
    },
  },
});
