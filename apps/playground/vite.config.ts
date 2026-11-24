import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import mdx from "@mdx-js/rollup";
import rehypeShiki from "@shikijs/rehype";
import type { ShikiTransformer } from "shiki";
import {
  createMdxOptions,
  createContentDiscovery,
  remarkRewriteSourceLinks,
} from "@moyarich/moyaforge-mdx";
import {
  createPreviewCodePlugin,
  createPreviewCodeRegistry,
  mdxRegistryPlugin,
  resolvePreviewCodeSource,
} from "@moyarich/moyaforge-mdx/vite";
import { monacoReactTypesPlugin } from "@moyarich/moyaforge-monaco/vite";
import registry from "./registry.config.ts";
import { sqliteSearchPlugin } from "@moyarich/moyaforge-search-sqlite/vite";

const contentRoot = fileURLToPath(new URL(".", import.meta.url));
const discovery = createContentDiscovery(registry, contentRoot);
const { registry: discovered } = await discovery.get();
const codePreview = createPreviewCodeRegistry({
  root: contentRoot,
  sources: registry.sources,
  pages: discovered.pages,
  resolutionScope: "global",
  outOfRoot: "allow",
});

const compileMdx = mdx(
  createMdxOptions({
    // Only published, repository-reviewed docs may use raw CSS previews.
    allowInlinePreviewStyles: true,
    additionalRemarkPlugins: [
      [
        remarkRewriteSourceLinks,
        {
          config: registry,
          root: contentRoot,
          routes: discovered.routes,
        },
      ],
    ],
    componentMappings: {
      "preview-code": {
        component: "PreviewCodeInline",
        booleanProps: ["refresh"],
        titleProp: "title",
        sourceProp: "code",
        filesProp: "sourceFiles",
        localSources: true,
        registerInlineReact: codePreview.inlineReact.register,
        resolvePreviewCodeComponent: (reference, authoredFile) =>
          resolvePreviewCodeSource({
            context: codePreview,
            reference,
            authoredFile,
          }),
      },
      "*": {
        component: "CustomBlock",
        typeProp: "type",
        titleProp: "title",
      },
      "code-group": {
        component: "CodeGroup",
        childType: "tab",
        childComponent: "CodeTab",
      },
    },
    highlightingPlugin: [
      rehypeShiki,
      {
        themes: { light: "github-light", dark: "github-dark" },
        fallbackLanguage: "text",
        // Shiki rebuilds <pre>; preserve compiler language metadata there.
        transformers: [
          {
            name: "moyaforge-code-language",
            pre(node) {
              node.properties["data-language"] = this.options.lang;
              const filename = /(?:^|\s)filename="([^"]+)"/.exec(
                this.options.meta?.__raw ?? "",
              )?.[1];
              if (filename) node.properties["data-filename"] = filename;
            },
          } satisfies ShikiTransformer,
        ],
      },
    ],
  }),
);

export default defineConfig({
  plugins: [
    monacoReactTypesPlugin(contentRoot),
    createPreviewCodePlugin({
      codePreview,
      componentRoots: [
        ...codePreview.componentRoots,
        fileURLToPath(
          new URL(
            "../../packages/moyaforge-ui/src/components",
            import.meta.url,
          ),
        ),
      ],
    }),
    mdxRegistryPlugin({
      discovery,
      registry,
      root: fileURLToPath(new URL(".", import.meta.url)),
    }),
    sqliteSearchPlugin({
      discovery,
      registry,
      root: fileURLToPath(new URL(".", import.meta.url)),
    }),
    {
      ...compileMdx,
      enforce: "pre",
      transform(code, id) {
        if (id.split("?")[1]?.split("&").includes("raw")) return;
        return compileMdx.transform.call(this, code, id);
      },
    },
    react({ include: /\.(?:js|jsx|md|mdx|ts|tsx)$/ }),
  ],
  // Other local Vite/Docker apps frequently use 5173. Vite still moves to
  // another available port if 5174 is occupied in this network namespace;
  // an explicit `--port` flag takes precedence over this default.
  server: { port: 5174 },
  worker: { format: "es" },
  base: process.env.VITE_BASE_PATH || process.env.PAGES_BASE_PATH || "/",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rolldownOptions: {
      onLog(level, log, handler) {
        // These dependencies emit empty directives, which have no runtime effect.
        if (
          level === "warn" &&
          log.code === "MODULE_LEVEL_DIRECTIVE" &&
          log.message.includes('module level directive "" in ') &&
          /[\\/]node_modules[\\/](?:@mdx-js[\\/]mdx|hast-util-to-estree)[\\/]/.test(
            log.id ?? "",
          )
        ) {
          return;
        }
        handler(level, log);
      },
    },
  },
});
