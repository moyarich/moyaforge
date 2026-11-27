import { createHash } from "node:crypto";
import { posix } from "node:path";
import { compile } from "@mdx-js/mdx";
import { parseAst, transformWithOxc } from "vite";
import type { InlinePreviewOptions } from "../../plugins/remark/preview-code/inline-preview-options.js";

const prefix = "virtual:moyaforge-mdx/react-preview/";

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
            options.reactBody,
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
            reactBody: false,
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
        const { code } = await transformWithOxc(example.source, example.options.reactBody ? example.authoredFile + ".preview.tsx" : filename, {
          lang: format as "tsx" | "jsx" | "ts" | "js",
          jsx: { runtime: "automatic" },
        });
        if (!example.options.reactBody) return code;
        const program = parseAst(code);
        if (program.body.some(node => node.type === "ExportDefaultDeclaration" ||
          (node.type === "ExportNamedDeclaration" && node.specifiers.some(specifier =>
            specifier.exported.type === "Identifier" && specifier.exported.name === "default")))) return code;
        const last = program.body.at(-1);
        if (last?.type !== "ExpressionStatement")
          throw new Error(`${example.authoredFile}: React preview requires a final JSX expression or a default export.`);
        // Keep imports and declarations at module scope; evaluate the final
        // expression inside a React component, not during module loading.
        return code.slice(0, last.start) +
          "export default function MoyaForgePreview() { return (" +
          code.slice(last.expression.start, last.expression.end) +
          "); }" + code.slice(last.end);
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
