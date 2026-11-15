import { maskInlineReactImports } from "../code-preview/mask-inline-react-imports.js";
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
) {
  const parse = this.parser;
  if (!parse) return;
  this.parser = (source, file) => {
    const headers = new Map<string, DirectiveHeader>();
    const lines = source.split(/(?<=\n)/);
    const stack: number[] = [];
    let reactFenceWidth: number | undefined;
    const reactBodies: { start: number; code: string[] }[] = [];
    let codeFence: string | undefined;
    const normalized = lines.map((line, index) => {
      const fence = /^ {0,3}(`{3,}|~{3,})(.*)/.exec(line);
      if (reactFenceWidth !== undefined && (fence || codeFence))
        reactBodies.at(-1)?.code.push(line.replace(/[^\r\n]/g, " "));
      if (fence) {
        if (!codeFence) codeFence = fence[1];
        else if (fence[1].startsWith(codeFence) && !fence[2].trim())
          codeFence = undefined;
        return line;
      }
      if (codeFence) return line;
      // Keep imports local to the compiled preview. Preserve offsets for source extraction.
      if (reactFenceWidth !== undefined) {
        if (new RegExp(`^ {0,3}:{${reactFenceWidth},}\\s*$`).test(line)) {
          reactFenceWidth = undefined;
        } else {
          reactBodies.at(-1)?.code.push(line);
        }
      } else {
        const reactOpener =
          /^ {0,3}(:{3,})code-preview(?:\[[^\]]*\])?\{([^{}]*)\}\s*$/.exec(
            line,
          );
        if (reactOpener?.[2].split(/\s+/).includes("react")) {
          reactFenceWidth = reactOpener[1].length;
          reactBodies.push({ start: index + 1, code: [] });
        }
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
        width >= 3 && native
          ? undefined
          : rules.map((rule) => rule(tail, width)).find(Boolean);
      if (!header) {
        if (width >= 3 && !native) stack.push(width);
        return line;
      }
      stack.push(width);
      const { type, ...metadata } = header;
      const marker = `mf-header-${headers.size}`;
      headers.set(marker, metadata);
      const opener =
        indent + ":".repeat(Math.max(3, width)) + " " + type + " " + marker;
      return opener.padEnd(line.length - newline.length) + newline;
    });
    for (const { start, code } of reactBodies) {
      const original = lines.slice(start, start + code.length).join("");
      const masked =
        maskInlineReactImports(original, code.join("")).match(
          /[^\n]*\n|[^\n]+$/g,
        ) ?? [];
      for (const [index, line] of masked.entries()) {
        if (line !== lines[start + index]) normalized[start + index] = line;
      }
    }
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
    const tree = parse(normalized.join(""), file) as Root;
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
