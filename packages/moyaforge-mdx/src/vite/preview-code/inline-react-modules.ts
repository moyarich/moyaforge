import { createHash } from "node:crypto";
import { posix } from "node:path";
import { compile } from "@mdx-js/mdx";
import { transformWithOxc } from "vite";
import type { InlinePreviewOptions } from "../../plugins/remark/preview-code/inline-preview-options.js";

const prefix = "virtual:moyaforge-mdx/react-preview/";

/**
 * Register isolated preview modules and their virtual sibling files for Vite.
 * IDs incorporate the authored filename, source and selected file contents.
 * Resolve sibling imports within the example, then allow the host to resolve
 * other imports relative to the authored page. Load MDX through its compiler,
 * JS/TS/JSX/TSX through Oxc, and CSS/JSON as generated modules.
 */
export function createInlineReactModules() {
  const modules = new Map<
    string,
    {
      source: string;
      authoredFile: string;
      options: InlinePreviewOptions;
      siblings: Map<string, string>;
    }
  >();
  return {
    register(
      source: string,
      authoredFile: string,
      options: InlinePreviewOptions = {},
    ) {
      const key = createHash("sha256")
        .update(
          JSON.stringify([
            authoredFile,
            source,
            options.format,
            options.filename,
            options.files,
          ]),
        )
        .digest("hex");
      const id = prefix + key;
      const siblings = new Map<string, string>();
      for (const file of options.files ?? [])
        siblings.set(file.label, `${id}/${encodeURIComponent(file.label)}.js`);
      for (const file of options.files ?? []) {
        const format = (file.language ?? posix.extname(file.label).slice(1))
          .replace("typescript", "ts")
          .replace("javascript", "js");
        modules.set("\0" + siblings.get(file.label), {
          source: file.code,
          authoredFile,
          options: {
            ...options,
            filename: file.label,
            format: format as InlinePreviewOptions["format"],
          },
          siblings,
        });
      }
      modules.set("\0" + id, { source, authoredFile, options, siblings });
      return id;
    },
    resolve(id: string) {
      if (modules.has("\0" + id)) return "\0" + id;
    },
    resolveImport(reference: string, importer: string | undefined) {
      const module = importer && modules.get(importer);
      if (!module || !reference.startsWith(".")) return;
      const filename = posix.normalize(
        posix.join(
          posix.dirname(module.options.filename ?? "entry.mdx"),
          reference,
        ),
      );
      const candidates = [
        filename,
        ...["tsx", "ts", "jsx", "js", "json", "mdx", "md"].map(
          (extension) => `${filename}.${extension}`,
        ),
      ];
      for (const candidate of candidates) {
        const id = module.siblings.get(candidate);
        if (id) return "\0" + id;
      }
    },
    importer(id: string | undefined) {
      return id ? modules.get(id)?.authoredFile : undefined;
    },
    async load(id: string) {
      const example = modules.get(id);
      if (!example) return;
      const {
        format = "mdx",
        mdxOptions,
        filename = "entry.mdx",
      } = example.options;
      if (format === "json")
        return `export default ${JSON.stringify(JSON.parse(example.source))};`;
      if (format === "css") {
        const key = createHash("sha256").update(id).digest("hex");
        return `const id=${JSON.stringify(key)}; const css=${JSON.stringify(example.source)}; if (typeof document !== "undefined" && !document.getElementById(id)) { const style=document.createElement("style"); style.id=id; style.textContent=css; document.head.append(style); } export default css;`;
      }
      if (["tsx", "jsx", "ts", "js"].includes(format)) {
        return (
          await transformWithOxc(example.source, filename, {
            lang: format as "tsx" | "jsx" | "ts" | "js",
            jsx: { runtime: "automatic" },
          })
        ).code;
      }
      return String(
        await compile(
          { value: example.source, path: example.authoredFile },
          {
            ...mdxOptions,
            format: "mdx",
            providerImportSource: "@mdx-js/react",
          },
        ),
      );
    },
  };
}
