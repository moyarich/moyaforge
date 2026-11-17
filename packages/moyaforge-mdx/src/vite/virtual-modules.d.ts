declare module "virtual:moyaforge-mdx/registry" {
  import type { ComponentType } from "react";

  type PageModule = { default: ComponentType };
  export const sources: Readonly<
    Record<
      string,
      {
        readonly pages: Readonly<Record<string, PageModule>>;
        readonly lazyPages: Readonly<
          Record<string, () => Promise<PageModule>>
        >;
      }
    >
  >;
}

declare module "virtual:moyaforge-mdx/metadata" {
  import type { NormalizedPage, PageInput } from "../registry/registry.js";
  import type { ContentManifestEntry } from "../content/manifest.js";
  import type { NavigationNode } from "../navigation/tree.js";
  import type { TocHeading } from "../navigation/toc.js";

  export const manifest: readonly ContentManifestEntry[];
  export const sources: Readonly<Record<string, readonly PageInput[]>>;
  export const pages: readonly NormalizedPage[];
  export const routes: readonly NormalizedPage[];
  export const navigation: readonly NormalizedPage[];
  export const tree: readonly NavigationNode[];
  export const headings: Readonly<Record<string, readonly TocHeading[]>>;
  export const sourceMetadata: Readonly<
    Record<string, Readonly<Record<string, unknown>>>
  >;
}

declare module "virtual:moyaforge-mdx/lazy-registry" {
  import type { ComponentType } from "react";

  export const sources: Readonly<
    Record<
      string,
      {
        readonly lazyPages: Readonly<
          Record<string, () => Promise<{ default: ComponentType }>>
        >;
      }
    >
  >;
}

declare module "virtual:moyaforge-mdx/code-preview-components" {
  const components: Record<
    string,
    () => Promise<Record<string, import("react").ComponentType>>
  >;
  export default components;
}

declare module "virtual:moyaforge-mdx/code-preview-sources" {
  const sources: Record<string, () => Promise<string>>;
  export default sources;
}
