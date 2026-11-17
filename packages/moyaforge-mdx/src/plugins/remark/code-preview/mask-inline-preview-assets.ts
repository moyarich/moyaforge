export interface InlinePreviewAsset {
  /** Only preview-local raw style and script elements are transformed. */
  tag: "style";
  /** Start offset of the opening tag in the authored MDX source. */
  offset: number;
  /** Unmodified raw body, including its original whitespace. */
  code: string;
}

declare module "vfile" {
  interface DataMap {
    inlinePreviewAssets?: InlinePreviewAsset[];
  }
}

/**
 * Mask raw CSS/JS bodies before the MDX parser sees their braces or syntax.
 *
 * Like inline {react} imports, only the *parse copy* is masked. The original
 * source remains available for code-preview source tabs and virtual modules.
 * CSS requires explicit trusted-docs opt-in. Inline scripts are forbidden.
 * Fenced source blocks and React previews remain untouched.
 */
export function maskInlinePreviewAssets(
  lines: readonly string[],
  { allowInlinePreviewStyles = false }: { allowInlinePreviewStyles?: boolean } = {},
): {
  lines: string[];
  assets: InlinePreviewAsset[];
} {
  const masked = [...lines];
  const assets: InlinePreviewAsset[] = [];
  let previewWidth: number | undefined;
  let codeFence: string | undefined;
  let openAsset: { tag: "style"; offset: number; lines: string[] } | undefined;
  let offset = 0;

  for (const [index, line] of lines.entries()) {
    const text = line.replace(/\r?\n$/, "");

    if (openAsset) {
      if (new RegExp("^\\s*<\\/" + openAsset.tag + ">\\s*$").test(text)) {
        assets.push({
          tag: openAsset.tag,
          offset: openAsset.offset,
          code: openAsset.lines.join(""),
        });
        openAsset = undefined;
      } else {
        openAsset.lines.push(line);
        masked[index] = line.replace(/[^\r\n]/g, " ");
      }
      offset += line.length;
      continue;
    }

    const fence = /^ {0,3}(\x60{3,}|~{3,})(.*)$/.exec(text);
    if (fence) {
      if (!codeFence) codeFence = fence[1];
      else if (fence[1].startsWith(codeFence) && !fence[2].trim())
        codeFence = undefined;
      offset += line.length;
      continue;
    }
    if (codeFence) {
      offset += line.length;
      continue;
    }

    if (previewWidth !== undefined) {
      if (new RegExp("^ {0,3}:{" + previewWidth + ",}\\s*$").test(text)) {
        previewWidth = undefined;
      } else {
        // A preview-local root does not isolate JavaScript from the host app.
        if (/<script(?=[\s>])/i.test(text))
          throw new Error(
            "Inline <script> is disabled in code-preview. Use a sandboxed iframe on a separate origin for executable examples.",
          );
        if (/<style(?=[\s>])/i.test(text)) {
          if (!allowInlinePreviewStyles)
            throw new Error(
              "Inline <style> in code-preview requires allowInlinePreviewStyles: true for trusted documentation.",
            );
          const opener = /^([ \t]*)<style>[ \t]*$/.exec(text);
          if (!opener)
            throw new Error(
              "Inline <style> must have standalone, attribute-free opening and closing tags.",
            );
          openAsset = {
            tag: "style",
            offset: offset + opener[1].length,
            lines: [],
          };
        }
      }
    } else {
      const preview =
        /^ {0,3}(:{3,})\s*code-preview(?:\[[^\]]*\])?(?:\{([^{}]*)\})?(?:\s+[^\r\n]*)?$/.exec(
          text,
        );
      if (preview && !preview[2]?.split(/\s+/).includes("react"))
        previewWidth = preview[1].length;
    }

    offset += line.length;
  }

  if (openAsset)
    throw new Error(
      "Unclosed <" + openAsset.tag + "> inside code-preview. Put the closing tag on its own line.",
    );

  return { lines: masked, assets };
}
