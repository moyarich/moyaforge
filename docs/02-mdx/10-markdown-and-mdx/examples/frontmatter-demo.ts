import { parse, stringify } from "yaml";
import guide from "./documents/docs/page.md?raw";
import installation from "./documents/docs/01-installation/page.md?raw";
import authoring from "./documents/docs/02-authoring/page.md?raw";
import type { PageFrontmatter } from "../../../../packages/moyaforge-mdx/src/registry/index.js";
import { createVirtualRegistry } from "../../../_shared/virtual-mdx/virtual-registry.js";

/** Update YAML only; the authored Markdown body stays unchanged. */
function updateFrontmatter(source: string, overrides: PageFrontmatter): string {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?=\r?\n|$)/.exec(source);
  if (!match) throw new Error("Example document is missing frontmatter");
  const metadata = { ...parse(match[1]), ...overrides };
  return `---\n${stringify(metadata).trimEnd()}\n---${source.slice(match[0].length)}`;
}

export interface SidebarGroupSettings {
  group: boolean;
  collapsible: boolean;
  defaultOpen: boolean;
}

export interface FrontmatterDemoOptions {
  sidebar?: SidebarGroupSettings;
  page?: PageFrontmatter;
}

/** Produce only in-memory documents; these never enter app content discovery. */
export function createFrontmatterFiles({
  sidebar = { group: true, collapsible: true, defaultOpen: true },
  page = {},
}: FrontmatterDemoOptions = {}): Record<string, string> {
  return {
    "docs/page.md": updateFrontmatter(guide, { sidebar }),
    "docs/01-installation/page.md": updateFrontmatter(installation, page),
    "docs/02-authoring/page.md": authoring,
  };
}

/** Adapt this example's flat paths to the reusable source-relative registry API. */
export function buildFrontmatterRegistry(
  files: Readonly<Record<string, string>>,
) {
  const documents = Object.fromEntries(
    Object.entries(files).map(([path, content]) => [
      path.slice("docs/".length),
      content,
    ]),
  );
  return createVirtualRegistry({ docs: documents }).registry;
}

export function createFrontmatterDemo(options: FrontmatterDemoOptions = {}) {
  const files = createFrontmatterFiles(options);
  return { files, registry: buildFrontmatterRegistry(files) };
}

export type FrontmatterDemo = ReturnType<typeof createFrontmatterDemo>;
