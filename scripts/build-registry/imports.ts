import { parse } from "@babel/parser";
import postcss from "postcss";
import parseValue from "postcss-value-parser";

type ValueNode = ReturnType<typeof parseValue>["nodes"][number];

const significant = (nodes: ValueNode[]) =>
  nodes.filter((node) => node.type !== "space" && node.type !== "comment");

function cssImportPath(params: string): string | undefined {
  const [first] = significant(parseValue(params).nodes);
  if (first?.type === "string") return first.value;
  if (first?.type === "function" && first.value.toLowerCase() === "url") {
    const args = significant(first.nodes);
    if (args.length === 1 && ["word", "string"].includes(args[0].type))
      return args[0].value;
  }
  return undefined;
}

function cssImports(text: string, file: string): string[] {
  const found = new Set<string>();
  // Parse real at-rules so examples inside comments are never copied.
  postcss.parse(text, { from: file }).walkAtRules(/^import$/i, (rule) => {
    const path = cssImportPath(rule.params);
    if (!path)
      throw Error(`Unresolvable CSS @import in ${file}: ${rule.params}`);
    // Remote and site-root URLs remain owned by the host stylesheet.
    if (/^(?:[a-z][a-z\d+.-]*:|\/|#)/i.test(path)) return;
    // CSS imports are relative to their stylesheet, even without './'.
    found.add(path.startsWith(".") ? path : `./${path}`);
  });
  return [...found];
}

function literalSpecifier(node: Record<string, unknown>): string | undefined {
  const source = node.source ?? node.argument;
  if (
    source &&
    typeof source === "object" &&
    "type" in source &&
    source.type === "StringLiteral" &&
    "value" in source &&
    typeof source.value === "string"
  )
    return source.value;
  return undefined;
}

function scriptImports(text: string, file: string): string[] {
  const ast = parse(text, {
    sourceType: "module",
    plugins: ["typescript", "jsx"],
    createImportExpressions: true,
  });
  const found = new Set<string>();

  function visit(value: unknown) {
    if (!value || typeof value !== "object") return;
    const node = value as Record<string, unknown>;
    const specifier = literalSpecifier(node);

    switch (node.type) {
      case "ImportExpression":
        if (specifier === undefined)
          throw Error(
            `Nonliteral dynamic import in ${file}; registry imports must be statically resolvable.`,
          );
        found.add(specifier);
        break;
      case "ImportDeclaration":
      case "ExportNamedDeclaration":
      case "ExportAllDeclaration":
      // Babel 8 uses source for TSImportType, while Babel 7 uses argument.
      case "TSImportType":
        if (specifier !== undefined) found.add(specifier);
        break;
    }

    for (const child of Object.values(node)) {
      if (Array.isArray(child)) child.forEach(visit);
      else visit(child);
    }
  }

  visit(ast.program);
  return [...found];
}

export const imports = (text: string, file: string) =>
  file.endsWith(".css") ? cssImports(text, file) : scriptImports(text, file);
