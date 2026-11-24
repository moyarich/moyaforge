import type { VFile } from "vfile";
import type { DirectiveNode } from "../remark-directive/directive-node.js";

declare module "vfile" {
  interface DataMap {
    inlineReactImports: DirectiveNode[];
  }
}

export function importInlineReactExample(
  file: VFile,
  moduleId: string,
): DirectiveNode {
  const imports = (file.data.inlineReactImports ??= []);
  let index = imports.length;
  let name: string;
  do {
    name = `MoyaForgeReactPreview${index++}`;
  } while (
    file.toString().includes(name) ||
    imports.some((node) => node.name === name)
  );
  const value = `import ${name} from ${JSON.stringify(moduleId)};`;
  imports.push({
    type: "mdxjsEsm",
    name,
    value,
    data: {
      estree: {
        type: "Program",
        sourceType: "module",
        body: [
          {
            type: "ImportDeclaration",
            specifiers: [
              {
                type: "ImportDefaultSpecifier",
                local: { type: "Identifier", name },
              },
            ],
            source: { type: "Literal", value: moduleId },
          },
        ],
      },
    },
  } as DirectiveNode);
  return {
    type: "mdxJsxFlowElement",
    name,
    attributes: [],
    children: [],
  } as unknown as DirectiveNode;
}
