import { stringify } from "yaml";
import type { PageFrontmatter } from "../../../../../../packages/moyaforge-mdx/src/registry/index.js";
import { createVirtualRegistry } from "../virtual-registry.js";

export const articleSections = [
  {
    id: "installation",
    title: "Installation",
    depth: 1,
    text: "Set up your documentation workspace.",
  },
  {
    id: "install-tools",
    title: "Install tools",
    depth: 2,
    text: "Install the project dependencies.",
  },
  {
    id: "configure-vite",
    title: "Configure Vite",
    depth: 3,
    text: "Register your compiler plugins.",
  },
  {
    id: "check-types",
    title: "Check types",
    depth: 4,
    text: "Confirm the editor recognizes React.",
  },
  {
    id: "publish",
    title: "Publish",
    depth: 2,
    text: "Build and review your site.",
  },
] as const;

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
}: FrontmatterDemoOptions = {}) {
  const landing = stringify({ title: "Guide", sidebar }).trimEnd();
  const metadata = stringify({ title: "Installation", ...page }).trimEnd();
  return {
    "docs/page.md": `---\n${landing}\n---\n\n# Guide\n\nStart here.\n`,
    "docs/01-installation/page.md": `---\n${metadata}\n---\n\n${articleSections.map((section) => `${"#".repeat(section.depth)} ${section.title}\n\n${section.text}`).join("\n\n")}\n`,
    "docs/02-authoring/page.md": "---\ntitle: Authoring\n---\n\n# Authoring\n",
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
