import { extractPageHeadings } from "./headings.js";
import type { TocHeading } from "./toc.js";
import { readFile, stat } from "node:fs/promises";
import { parseDocument } from "yaml";
import { glob } from "tinyglobby";
import { relative, resolve, sep } from "node:path";
import {
  buildPageRegistry,
  type PageFrontmatter,
  type PageInput,
  type PageRegistry,
  type TocSetting,
} from "./registry.js";

export interface ContentSource {
  base: string;
  include: readonly string[];
  exclude?: readonly string[];
  metadata?: readonly string[];
  navigation?: { label?: string; order?: number };
}
export interface ContentSourcesConfig {
  sources: Record<string, ContentSource>;
  /** Default TOC configuration, overridden by per-page YAML frontmatter. */
  toc?: TocSetting;
}

/** Parse authored YAML exactly once without requiring compiled MDX JavaScript exports. */
export function parsePageFrontmatter(
  text: string,
  filename: string,
): PageFrontmatter {
  const normalized = text.replace(/^\uFEFF/, "");
  if (!normalized.startsWith("---\n") && !normalized.startsWith("---\r\n"))
    return {};
  const match = /^---\r?\n([\s\S]*?)\r?\n(?:---|\.\.\.)(?:\r?\n|$)/.exec(
    normalized,
  );
  if (!match) throw new Error(`${filename}: unterminated YAML frontmatter`);
  const document = parseDocument(match[1], { uniqueKeys: true, strict: true });
  if (document.errors.length)
    throw new Error(
      `${filename}: invalid YAML frontmatter: ${document.errors.map((error) => error.message).join("; ")}`,
    );
  const value: unknown = document.toJS();
  if (value == null) return {};
  if (typeof value !== "object" || Array.isArray(value))
    throw new Error(`${filename}: YAML frontmatter must be an object`);
  return value as PageFrontmatter;
}

export interface DiscoveredContent {
  registry: PageRegistry;
  inputs: Record<string, PageInput[]>;
  headings: Record<string, TocHeading[]>;
}

/** Collect normalized metadata at build time; never import compiled page components. */
export async function discoverContent(
  config: ContentSourcesConfig,
  root: string,
): Promise<DiscoveredContent> {
  const inputs: Record<string, PageInput[]> = {};
  const headings: Record<string, TocHeading[]> = {};
  for (const [sourceName, source] of Object.entries(config.sources)) {
    const base = resolve(root, source.base);
    let baseInfo;
    try {
      baseInfo = await stat(base);
    } catch (error) {
      if ((error as { code?: string }).code === "ENOENT") {
        throw new Error(`Content source "${sourceName}": directory does not exist: ${base}`, { cause: error });
      }
      throw error;
    }
    if (!baseInfo.isDirectory()) {
      throw new Error(`Content source "${sourceName}": expected directory: ${base}`);
    }
    const files = await glob([...source.include], {
      cwd: base,
      ignore: source.exclude ? [...source.exclude] : [],
      absolute: true,
      onlyFiles: true,
    });
    const pages: PageInput[] = [];
    for (const file of files.sort()) {
      if (!/(?:^|[\\/])page\.mdx?$/.test(file)) continue;
      const name = relative(base, file).split(sep).join("/");
      const raw = await readFile(file, "utf8");
      pages.push({ file: name, frontmatter: parsePageFrontmatter(raw, file) });
      headings[`${sourceName}/${name}`] = await extractPageHeadings(raw, file);
    }
    inputs[sourceName] = pages;
  }
  return {
    inputs,
    headings,
    registry: buildPageRegistry(inputs, { toc: config.toc }),
  };
}
