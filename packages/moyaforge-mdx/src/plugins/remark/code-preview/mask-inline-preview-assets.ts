export interface InlinePreviewAsset {
  /** Only preview-local raw style and script elements are transformed. */
  tag: "style" | "script";
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
 * Standalone, attribute-free tags inside Markdown code-preview are supported.
 * Fenced source blocks and React previews remain untouched.
 */
export function maskInlinePreviewAssets(lines: readonly string[]): {
  lines: string[];
  assets: InlinePreviewAsset[];
} {
  const masked = [...lines];
  const assets: InlinePreviewAsset[] = [];
  let previewWidth: number | undefined;
  let codeFence: string | undefined;
  let openAsset:
    | { tag: InlinePreviewAsset["tag"]; offset: number; lines: string[] }
    | undefined;
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
        const opener = /^([ \t]*)<(style|script)>[ \t]*$/.exec(text);
        if (opener) {
          openAsset = {
            tag: opener[2] as InlinePreviewAsset["tag"],
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
