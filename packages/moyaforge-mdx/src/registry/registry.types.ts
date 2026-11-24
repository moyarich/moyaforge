import type { NavigationNode } from "../navigation/tree/index.js";

/** Visible pages appear in navigation; hidden pages remain routable; disabled pages do neither. */
export type NavigationMode = "visible" | "hidden" | "disabled";
/** Position of the rendered table of contents, or none to omit it. */
export type TocPlacement = "right" | "sidebar" | "inline" | "none";
/** Page-level overrides for the table of contents. */
export interface TocOptions {
  /** Layout position for the outline. */
  placement?: TocPlacement;
  /** Heading displayed above the outline; unrelated to the page title. */
  label?: string;
  /** First included heading depth, from 1 through 6. */
  minDepth?: number;
  /** Last included heading depth, at least minDepth and no greater than 6. */
  maxDepth?: number;
  /** Allow readers to collapse the outline. */
  collapsible?: boolean;
  /** Initial disclosure state when the outline is collapsible. */
  defaultOpen?: boolean;
}
/** Enable/disable an outline, or configure its page-level presentation. */
export type TocSetting = boolean | TocOptions;
/** Presentation options for a source landing page promoted to a sidebar heading. */
export interface SidebarOptions {
  /** Use the source landing page as the linked section heading. */
  group?: boolean;
  /** Show a separate control for collapsing the section's children. */
  collapsible?: boolean;
  /** Initial disclosure state of the section. */
  defaultOpen?: boolean;
}
/** Authored YAML metadata; title is the sole page-name field. */
export interface PageFrontmatter {
  /** Display name and source of the generated URL ID; omitted titles fall back to the filename. */
  title?: string;
  /** Optional Lucide icon name in kebab case, e.g. folder-open. */
  icon?: string;
  /** Summary available to page chrome, metadata consumers, and search. */
  description?: string;
  /** Explicit finite sibling order, overriding the numeric filename prefix. */
  order?: number;
  /** Route and sidebar visibility. @default "visible" */
  navigation?: NavigationMode;
  /** Source landing-page heading and disclosure options. */
  sidebar?: SidebarOptions;
  /** Override the registry's default outline settings for this page. */
  toc?: TocSetting;
}
/** A source-relative Markdown document supplied to registry normalization. */
export interface PageInput {
  /** Source-relative path, such as 01-guide/02-api/page.mdx. */
  file: string;
  /** Parsed YAML metadata; absent fields use registry defaults. */
  frontmatter?: PageFrontmatter;
}
/** A validated page with its resolved identity, route, ordering, and presentation settings. */
export interface RegistryPage {
  /** Key of the content source containing this document. */
  source: string;
  /** Original source-relative Markdown or MDX filename. */
  file: string;
  /** Optional repository-relative filename for edit links and source attribution. */
  sourcePath?: string;
  /** URL-safe identity generated from the resolved title. */
  id: string;
  /** Absolute application route, including the source and ancestor segments. */
  path: string;
  /** Resolved display name; used consistently by navigation and search. */
  title: string;
  /** Optional Lucide icon name from frontmatter. */
  icon?: string;
  /** Optional authored page summary. */
  description?: string;
  /** Explicit or filename-derived numeric navigation order. */
  order: number;
  /** Resolved route and navigation visibility. */
  navigation: NavigationMode;
  /** Optional source landing-page presentation settings. */
  sidebar?: SidebarOptions;
  /** Authored, project-level, or default outline configuration. */
  toc: TocSetting;
  /** Immediate ancestor route, including virtual folders; null for source roots. */
  parentPath: string | null;
}
/** Consistent route, navigation, and relationship views of the same normalized pages. */
export interface PageRegistry {
  /** All pages, including hidden and disabled documents, in deterministic order. */
  pages: RegistryPage[];
  /** Routable pages, including hidden documents and excluding disabled ones. */
  routes: RegistryPage[];
  /** Visible pages in depth-first sidebar order. */
  navigation: RegistryPage[];
  /** Navigation hierarchy, retaining virtual folders without landing pages. */
  tree: NavigationNode[];
  /** Routable pages indexed by exact canonical route. */
  byPath: Map<string, RegistryPage>;
  /** Visible ancestor pages followed by the requested page; empty for unknown routes. */
  breadcrumbs(path: string): RegistryPage[];
  /** Adjacent visible pages in navigation order; empty for pages absent from navigation. */
  previousNext(path: string): {
    previous?: RegistryPage;
    next?: RegistryPage;
  };
}
