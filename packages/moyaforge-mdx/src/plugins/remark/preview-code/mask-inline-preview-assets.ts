import { previewOpening } from "../remark-directive/directive-attributes.js";

export interface InlinePreviewAsset {
  /** Only preview-local raw style and script elements are transformed. */
  tag: "style" | "script";
  /** Start offset of the opening tag in the authored MDX source. */
  offset: number;
  /** Unmodified raw body, including its original whitespace. */
  code: string;
  /** Only trusted CSS may render; script blocks are always source-only. */
  render: boolean;
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
 * source remains available for preview-code source tabs and virtual modules.
 * Both style and script are preserved in source. Only reviewed CSS renders.
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
          render: openAsset.tag === "style" && allowInlinePreviewStyles,
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
        // Preserve raw source, but never turn <script> into executable MDX.
        // Require standalone, attribute-free script tags to avoid accidental
        // execution by HTML/JSX while rejecting external scripts and handlers.
        const rawScript = /<script(?=[\s/>])/i.test(text);
        if (rawScript) {
          const opener = /^([ \t]*)<script>[ \t]*$/.exec(text);
          if (!opener)
            throw new Error(
              "Inline <script> must use standalone, attribute-free tags in preview-code; scripts are source-only and never execute.",
            );
          openAsset = {
            tag: "script",
            offset: offset + opener[1].length,
            lines: [],
          };
        } else if (/<style(?=[\s/>])/i.test(text)) {
          const opener = /^([ \t]*)<style>[ \t]*$/.exec(text);
          // Legacy MDX JSX style expressions (e.g. <style>{...}</style>)
          // remain supported in trusted preview pages.
          if (!opener) {
            if (!allowInlinePreviewStyles)
              throw new Error(
                "Inline <style> in preview-code requires allowInlinePreviewStyles: true for trusted documentation.",
              );
          } else {
            openAsset = {
              tag: "style",
              offset: offset + opener[1].length,
              lines: [],
            };
          }
        }
      }
    } else {
      const preview = previewOpening(text);
      if (preview && !preview.react) previewWidth = preview.width;
    }

    offset += line.length;
  }

  if (openAsset)
    throw new Error(
      "Unclosed <" + openAsset.tag + "> inside preview-code. Put the closing tag on its own line.",
    );

  return { lines: masked, assets };
}
