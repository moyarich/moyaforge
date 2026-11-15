import { createHash } from "node:crypto";
import { compile } from "@mdx-js/mdx";

const prefix = "virtual:moyaforge-mdx/react-preview/";

export function createInlineReactModules() {
  const modules = new Map<string, { source: string; authoredFile: string }>();
  return {
    register(source: string, authoredFile: string) {
      const key = createHash("sha256")
        .update(JSON.stringify([authoredFile, source]))
        .digest("hex");
      const id = prefix + key;
      modules.set("\0" + id, { source, authoredFile });
      return id;
    },
    resolve(id: string) {
      if (modules.has("\0" + id)) return "\0" + id;
    },
    importer(id: string | undefined) {
      return id ? modules.get(id)?.authoredFile : undefined;
    },
    async load(id: string) {
      const example = modules.get(id);
      if (!example) return;
      return String(
        await compile(
          { value: example.source, path: example.authoredFile },
          { format: "mdx", providerImportSource: "@mdx-js/react" },
        ),
      );
    },
  };
}
