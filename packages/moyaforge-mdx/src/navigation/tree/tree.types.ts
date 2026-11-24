import type { RegistryPage } from "../../registry/index.js";

/**
 * A node in the documentation navigation hierarchy.
 * Directory nodes may exist without a corresponding page, allowing nested
 * routes to be represented without inventing a landing page.
 */
export interface NavigationNode {
  /** Canonical absolute route, including virtual directory routes. */
  path: string;
  /** Registered page at this route, if it has a landing page. */
  page?: RegistryPage;
  /** Nested navigation nodes ordered for display. */
  children: NavigationNode[];
}

/** A sidebar section for one registered documentation source. */
export interface DocumentationGroup {
  /** Unique source key from the content registry. */
  source: string;
  /** Optional source landing page promoted to the section heading. */
  page?: RegistryPage;
  collapsible?: boolean;
  defaultOpen?: boolean;
  /** Sidebar label, falling back to the source key. */
  label: string;
  /** Source-specific navigation roots in display order. */
  nodes: NavigationNode[];
}

/** Source-level options for navigation group display and ordering. */
export interface DocumentationSourceNavigation {
  /** Optional sidebar presentation metadata. */
  navigation?: {
    /** Human-readable group label. */
    label?: string;
    /** Ascending group order; defaults to zero. */
    order?: number;
  };
}
