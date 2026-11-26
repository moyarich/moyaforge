import type { ReactNode } from "react";
import type { RegistryPage } from "@moyarich/moyaforge-mdx";
import type { DocumentationSearchProps } from "../../Search/DocumentationSearch.js";

/** Page metadata used by the shell; complete RegistryPage objects can be passed directly. */
export type DocumentationSitePage = Pick<
  RegistryPage,
  "path" | "title" | "sourcePath"
> &
  Partial<Pick<RegistryPage, "navigation" | "parentPath">>;

export interface DocumentationSiteProps {
  title: string;
  children: ReactNode;
  repository?: string;
  repositoryBranch?: string;
  /** Registry routes, including hidden pages; visibility is applied by the shell. */
  pages?: readonly DocumentationSitePage[];
  currentPath?: string;
  /** Ancestors followed by the current page. Defaults to RegistryPage parentPath relationships, with route hierarchy as a standalone fallback. */
  breadcrumbs?: readonly Pick<RegistryPage, "path" | "title">[];
  sidebar?: ReactNode;
  sidebarHeader?: ReactNode;
  sidebarFooter?: ReactNode;
  sidebarLabel?: string;
  sidebarVersion?: string;
  outline?: ReactNode;
  outlineHeader?: ReactNode;
  outlineFooter?: ReactNode;
  onSearch?: DocumentationSearchProps["search"];
  searchShortcut?: Pick<DocumentationSearchProps, "hotkey" | "kbd">;
  onNavigate?: (path: string) => void;
}
