import type { ReactNode } from "react";
import type { RegistryPage } from "@moyarich/moyaforge-mdx";
import type { DocumentationSearchProps } from "../../Search/DocumentationSearch.js";

/** Page metadata used by the shell; complete RegistryPage objects can be passed directly. */
export type DocumentationSitePage = Pick<
  RegistryPage,
  "path" | "title" | "sourcePath"
> &
  Partial<Pick<RegistryPage, "navigation" | "parentPath">>;

/** Host-supplied page data, navigation, search and documentation chrome slots. */
export interface DocumentationSiteProps {
  /** Site name shown in the header. */
  title: string;
  /** Current article content. */
  children: ReactNode;
  /** Repository URL for GitHub and contribution links. */
  repository?: string;
  /** Branch for edit links. @default "main" */
  repositoryBranch?: string;
  /** Registry routes, including hidden pages; visibility is applied by the shell. */
  pages?: readonly DocumentationSitePage[];
  /** Current page route used for navigation and breadcrumbs. */
  currentPath?: string;
  /** Ancestors followed by the current page. Defaults to RegistryPage parentPath relationships, with route hierarchy as a standalone fallback. */
  breadcrumbs?: readonly Pick<RegistryPage, "path" | "title">[];
  /** Replace the default sidebar. */
  sidebar?: ReactNode;
  /** Custom header for the default sidebar. */
  sidebarHeader?: ReactNode;
  /** Optional footer for the default sidebar. */
  sidebarFooter?: ReactNode;
  /** Label shown in the default sidebar header. */
  sidebarLabel?: string;
  /** Version shown in the default sidebar header. */
  sidebarVersion?: string;
  /** Optional article outline content. */
  outline?: ReactNode;
  /** Optional content above the outline. */
  outlineHeader?: ReactNode;
  /** Optional content below the outline. */
  outlineFooter?: ReactNode;
  /** Asynchronous search implementation; omit to hide search. */
  onSearch?: DocumentationSearchProps["search"];
  /** Keyboard shortcut and visible hint for search. */
  searchShortcut?: Pick<DocumentationSearchProps, "hotkey" | "kbd">;
  /** Optional host router callback for ordinary link clicks. */
  onNavigate?: (path: string) => void;
}
