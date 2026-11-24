import { parseImportsExports } from "parse-imports-exports";

/** Keep imports out of the page's MDX scope while preserving source offsets. */
export function maskInlineReactImports(source: string, code: string): string {
  const imports = parseImportsExports(code, {
    ignoreDynamicImports: true,
    ignoreRequires: true,
  });
  if (imports.defaultExport) {
    // Fenced source tabs were blanked in code by the directive parser. Preserve
    // those and source directives, but hide the complete module from MDX.
    const codeLines = code.split(/(?<=\n)/);
    return source
      .split(/(?<=\n)/)
      .map((line, index) => {
        const moduleLine = codeLines[index] ?? "";
        return !moduleLine.trim() || /^\s*:{2,}/.test(moduleLine)
          ? line
          : line.replace(/\S/g, "x");
      })
      .join("");
  }
  const groups: (
    Record<string, { start: number; end: number }[]> | undefined
  )[] = [
    imports.namedImports,
    imports.namespaceImports,
    imports.typeNamedImports,
    imports.typeNamespaceImports,
  ];
  const declarations = groups.flatMap((group) =>
    Object.values(group ?? {}).flat(),
  );

  // The outer MDX parser only treats line-leading imports as module statements.
  const ranges = declarations.filter(({ start }) =>
    /^[\t ]*$/.test(code.slice(code.lastIndexOf("\n", start - 1) + 1, start)),
  );
  let masked = source;
  for (const { start, end } of ranges.sort((a, b) => b.start - a.start)) {
    masked =
      masked.slice(0, start) +
      masked.slice(start, end).replace(/\S/g, "x") +
      masked.slice(end);
  }
  return masked;
}
