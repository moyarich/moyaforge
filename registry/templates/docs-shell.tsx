import type { ReactNode } from "react";
import { DocumentationSite } from "./components/Layout/DocsLayout/DocumentationSite.js";
import { SidebarV1 } from "./components/SidebarV1/SidebarV1.js";
import { Navigation } from "./components/SidebarV1/Navigation.js";
import { DocOutlineShell } from "./components/DocOutline/DocOutlineShell.js";
import {
  DocOutline,
  type DocHeading,
} from "./components/DocOutline/DocOutline.js";
import { useContentRouting } from "./components/Routing/content-routing.js";
import {
  buildDocumentationGroups,
  type DocumentationSources,
} from "./components/Layout/DocsLayout/utils.js";

/** This composition is installed as editable app-owned source. */
export function DocsShell({
  children,
  title = "Documentation",
  sources = {},
  headings,
  sidebarHeader,
  outlineFooter,
  search,
}: {
  children: ReactNode;
  title?: string;
  sources?: DocumentationSources;
  headings?: readonly DocHeading[];
  sidebarHeader?: ReactNode;
  outlineFooter?: ReactNode;
  search?: (query: string) => Promise<string[]>;
}) {
  const { routes } = useContentRouting();
  const groups = buildDocumentationGroups(routes, sources);
  return (
    <DocumentationSite
      title={title}
      sources={sources}
      search={search}
      sidebar={
        <SidebarV1 header={sidebarHeader}>
          <Navigation groups={groups} />
        </SidebarV1>
      }
      outline={
        <DocOutlineShell footer={outlineFooter}>
          <DocOutline headings={headings} />
        </DocOutlineShell>
      }
    >
      {children}
    </DocumentationSite>
  );
}
