declare module "virtual:moyaforge-mdx/metadata" {
  import type { NormalizedPage, PageInput } from "./dist/registry/registry.js";
  import type { ContentManifestEntry } from "./dist/content/manifest.js";
  import type { NavigationNode } from "./dist/navigation/tree.js";
  import type { TocHeading } from "./dist/navigation/toc.js";

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
