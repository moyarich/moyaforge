import { maskInlinePreviewAssets } from "../preview-code/mask-inline-preview-assets.js";
import type { Root } from "mdast";
import type { Processor } from "unified";

import type { DirectiveHeader } from "./directive-node.js";

export type DirectiveHeaderRule = (
  tail: string,
  width: number,
) => (DirectiveHeader & { type: string }) | undefined;

/** Normalize supported container headers before MDX reads braces as expressions. */
export function remarkDirectiveParser(
  this: Processor,
  rules: readonly DirectiveHeaderRule[],
  options: { allowInlinePreviewStyles?: boolean } = {},
) {
  const parse = this.parser;
  if (!parse) return;
  this.parser = (source, file) => {
    const headers = new Map<string, DirectiveHeader>();
    const lines = source.split(/(?<=\n)/);
    const inlineAssets = maskInlinePreviewAssets(lines, options);
    file.data.inlinePreviewAssets = inlineAssets.assets;
    const stack: number[] = [];
    let codeFence: string | undefined;
    let authoredOffset = 0;
    const normalized = lines.map((_originalLine, index) => {
      const offset = authoredOffset;
      authoredOffset += lines[index].length;
      let line = inlineAssets.lines[index];
      const fence = /^ {0,3}(`{3,}|~{3,})(.*)/.exec(line);
      if (fence) {
        if (!codeFence) codeFence = fence[1];
        else if (fence[1].startsWith(codeFence) && !fence[2].trim())
          codeFence = undefined;
        return line;
      }
      if (codeFence) return line;
      const obsoletePreviewDirective =
        /^ {0,3}:{2,}[ \t]*(code-preview(?:-sources)?)(?=\[|\{|\s|$)/.exec(
          line,
        );
      if (obsoletePreviewDirective) {
        const name = obsoletePreviewDirective[1];
        const replacement =
          name === "code-preview" ? "preview-code" : "preview-code-sources";
        file.fail(
          `Unsupported directive "${name}". Use "${replacement}" instead.`,
          {
            line: index + 1,
            column: 1,
          },
        );
      }
      // An empty replacement preset is equivalent to omitting it.
      if (/^ {0,3}:{3,}preview-code(?:\[[^\]]*\])?\{/.test(line)) {
        line = line.replace(/(\sreplacements)=(?=[\t ]*\})/, "$1 ");
      }

      const match = /^( {0,3})(:{2,})([^\r\n]*)(\r?\n)?$/.exec(line);
      if (!match) return line;
      const [, indent, colons, tail, newline = ""] = match;
      const width = colons.length;
      if (!tail.trim()) {
        if (stack.at(-1) !== width) return line;
        stack.pop();
        return width === 2 ? indent + ":::" + newline : line;
      }

      const native = /^[\w-]+(?:\[|\{|\s*$)/.test(tail);
      const header =
        rules.map((rule) => rule(tail, width)).find(Boolean);
      if (!header) {
        if (width >= 3 && !native) stack.push(width);
        return line;
      }
      stack.push(width);
      const { type, ...metadata } = header;
      const marker = `mf-header-${headers.size}`;
      headers.set(marker, { ...metadata, offset });
      if (type === "preview-code" && Object.hasOwn(metadata.props ?? {}, "react"))
        file.fail("The react preview flag was removed. Use preview=\"Example.tsx\" with a named TSX fence.", { line: index + 1, column: 1 });
      const opener =
        indent + ":".repeat(Math.max(3, width)) + " " + type + " " + marker;
      return opener.padEnd(line.length - newline.length) + newline;
    });
    const insertions: { offset: number; length: number }[] = [];
    let normalizedOffset = 0;
    normalized.forEach((line, index) => {
      const length = line.length - lines[index].length;
      if (length > 0)
        insertions.push({
          offset: normalizedOffset + lines[index].length,
          length,
        });
      normalizedOffset += line.length;
    });
    file.data.directiveHeaders = headers;
    let tree: Root;
    try {
      tree = parse(normalized.join(""), file) as Root;
    } catch (error) {
      // Micromark errors do not always carry the VFile path. Preserve the
      // original diagnostic, including its line, column and rule identifier.
      if (error instanceof Error && file.path && "file" in error && !error.file) {
        Object.assign(error, { file: file.path });
      }
      throw error;
    }
    if (insertions.length) {
      function restore(node: {
        position?: Root["position"];
        children?: unknown[];
      }) {
        for (const point of [node.position?.start, node.position?.end]) {
          if (point?.offset !== undefined) {
            const current = point.offset;
            point.offset -= insertions.reduce(
              (total, insertion) =>
                total +
                Math.max(
                  0,
                  Math.min(insertion.length, current - insertion.offset),
                ),
              0,
            );
          }
        }
        for (const child of node.children ?? [])
          restore(child as Parameters<typeof restore>[0]);
      }
      restore(tree);
    }
    return tree;
  };
}
