import { createDiagnostic, DiagnosticCollector, formatGitHubActionsDiagnostic } from "../diagnostics/index.js";
import { extractPageHeadings } from "./headings.js";
import { isContentPageFile } from "./source-files.js";
import type { TocHeading } from "../navigation/toc/index.js";
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
} from "../registry/index.js";

export interface ContentSource {
  base: string;
  /** Tinyglobby patterns, including brace expansion for file extensions. */
  include: readonly string[];
  /** Include ordinary Markdown files in addition to directory landing pages. */
  pageFiles?: "canonical" | "all";
  /** Tinyglobby ignore patterns; brace expansion can group filename variants. */
  exclude?: readonly string[];
  metadata?: readonly string[];
  navigation?: { label?: string; order?: number };
}
export interface ContentSourcesConfig {
  sources: Record<string, ContentSource>;
  /** Default TOC configuration, overridden by per-page YAML frontmatter. */
  toc?: TocSetting;
  /** Collect errors across pages before failing. Defaults to true. */
  collectDiagnostics?: boolean;
  /** Emit GitHub Actions annotations when running in CI. Defaults to auto. */
  githubActionsAnnotations?: boolean;
}

/**
 * Read leading YAML frontmatter without compiling or evaluating MDX.
 * @param text - Complete authored Markdown or MDX text.
 * @param filename - Source filename included in validation errors.
 * @returns Parsed metadata, or an empty object when frontmatter is absent or null.
 * @throws If the block is unterminated, invalid YAML, or not an object.
 */
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
  /** Source-relative identity metadata, kept separate from authored page frontmatter. */
  metadata: Record<string, Record<string, unknown>>;
}

/**
 * Discover configured documentation files and build their normalized registry.
 * Reads source text, extracts headings and loads configured JSON metadata without importing page components.
 * @param config - Named content sources, TOC defaults and diagnostic settings.
 * @param root - Directory against which source bases are resolved.
 * @returns Registry, original page inputs, heading trees and source metadata.
 * @throws If a source directory, page, metadata file or registry is invalid.
 */
export async function discoverContent(
  config: ContentSourcesConfig,
  root: string,
): Promise<DiscoveredContent> {
  const diagnostics = new DiagnosticCollector();
  const inputs: Record<string, PageInput[]> = {};
  const headings: Record<string, TocHeading[]> = {};
  const metadata: Record<string, Record<string, unknown>> = {};
  for (const [sourceName, source] of Object.entries(config.sources)) {
    const base = resolve(root, source.base);
    let baseInfo;
    try {
      baseInfo = await stat(base);
    } catch (error) {
      if ((error as { code?: string }).code === "ENOENT") {
        throw new Error(
          `Content source "${sourceName}": directory does not exist: ${base}`,
          { cause: error },
        );
      }
      throw error;
    }
    if (!baseInfo.isDirectory()) {
      throw new Error(
        `Content source "${sourceName}": expected directory: ${base}`,
      );
    }
    const files = await glob([...source.include], {
      cwd: base,
      ignore: source.exclude ? [...source.exclude] : [],
      absolute: true,
      onlyFiles: true,
    });
    const pages: PageInput[] = [];
    for (const file of files.sort()) {
      if (
        source.pageFiles === "all"
          ? !/\.mdx?$/.test(file)
          : !isContentPageFile(file)
      )
        continue;
      const name = relative(base, file).split(sep).join("/");
      let raw: string | undefined;
      let phase: "discovery" | "frontmatter" = "discovery";
      try {
        raw = await readFile(file, "utf8");
        phase = "frontmatter";
        const frontmatter = parsePageFrontmatter(raw, file);
        phase = "discovery";
        headings[`${sourceName}/${name}`] = await extractPageHeadings(raw, file);
        pages.push({ file: name, frontmatter });
      } catch (error) {
        const diagnostic = createDiagnostic(error, {
          code: phase === "frontmatter" ? "MDX_INVALID_FRONTMATTER" : "MDX_DISCOVERY_FAILED",
          phase,
          location: { file },
          source: raw,
        });
        diagnostics.add(diagnostic);
        if (config.githubActionsAnnotations ?? process.env.GITHUB_ACTIONS === "true") {
          const workspace = process.env.GITHUB_WORKSPACE;
          const annotation = workspace ? { ...diagnostic, location: { ...diagnostic.location, file: relative(workspace, diagnostic.location.file).split(sep).join("/") } } : diagnostic;
          console.error(formatGitHubActionsDiagnostic(annotation));
        }
        if (config.collectDiagnostics === false) diagnostics.throwIfErrors();
      }
    }
    inputs[sourceName] = pages;
    const sourceMetadata: Record<string, unknown> = {};
    if (source.metadata?.length) {
      const files = await glob([...source.metadata], {
        cwd: base,
        absolute: true,
        onlyFiles: true,
      });
      for (const file of files.sort()) {
        const name = relative(base, file).split(sep).join("/");
        if (!name.endsWith(".json")) continue;
        try {
          sourceMetadata[name] = JSON.parse(await readFile(file, "utf8"));
        } catch (error) {
          throw new Error(`${file}: invalid JSON source metadata`, {
            cause: error,
          });
        }
      }
    }
    metadata[sourceName] = sourceMetadata;
  }
  diagnostics.throwIfErrors();
  return {
    inputs,
    headings,
    metadata,
    registry: buildPageRegistry(inputs, { toc: config.toc }),
  };
}

/**
 * Share a cached discovery promise between build-time consumers.
 * Concurrent get calls reuse the same discovery; failed discovery clears the cache.
 * @param config - Content source configuration.
 * @param root - Application root for resolving content directories.
 * @returns A get/invalidate pair for reading and refreshing discovery.
 * @example const discovery = createContentDiscovery(config, root);
 */
export function createContentDiscovery(
  config: ContentSourcesConfig,
  root: string,
) {
  let pending: Promise<DiscoveredContent> | undefined;
  return {
    get() {
      return (pending ??= discoverContent(config, root).catch((error) => {
        pending = undefined;
        throw error;
      }));
    },
    invalidate() {
      pending = undefined;
    },
  };
}
