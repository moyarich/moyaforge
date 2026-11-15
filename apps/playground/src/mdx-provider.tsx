import { lazy, type ComponentProps, type PropsWithChildren } from "react";
import type { MDXComponents } from "mdx/types.js";
import {
  BookOpen,
  Camera,
  Check,
  ChevronRight,
  Code,
  ExternalLink,
  FileText,
  Info,
  Search as SearchIcon,
  Settings,
  Terminal as TerminalIcon,
} from "lucide-react";
import { MDXProvider } from "@mdx-js/react";
import { Console, Terminal } from "@moyarich/console";
import { CustomBlock } from "../../../packages/moyaforge-ui/src/components/CustomBlock/index.ts";
import { CodeBlock } from "../../../packages/moyaforge-ui/src/components/CodeBlock/index.ts";
import {
  CodeGroup,
  CodeTab,
} from "../../../packages/moyaforge-ui/src/components/CodeGroup/index.ts";
import { CopyButton } from "../../../packages/moyaforge-ui/src/components/CopyButton/index.ts";
import { Demo } from "../../../packages/moyaforge-ui/src/components/Demo/index.ts";
import { NavigationTree } from "../../../packages/moyaforge-ui/src/components/NavigationTree/index.ts";
import { Page } from "../../../packages/moyaforge-ui/src/components/Page/index.ts";
import { Search } from "../../../packages/moyaforge-ui/src/components/Search/index.ts";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarItem,
  SidebarSection,
} from "../../../packages/moyaforge-ui/src/components/SidebarV2/index.ts";
import { Source } from "../../../packages/moyaforge-ui/src/components/Source/index.ts";
import { TableOfContents } from "../../../packages/moyaforge-ui/src/components/TableOfContents/index.ts";
import { EmptyState } from "../../../packages/moyaforge-ui/src/components/EmptyState/index.ts";
import { EditPageLink } from "../../../packages/moyaforge-ui/src/components/EditPageLink/index.ts";
import { DocOutline } from "../../../packages/moyaforge-ui/src/components/DocOutline/index.ts";
import { SidebarV1 } from "../../../packages/moyaforge-ui/src/components/SidebarV1/index.ts";
import { DocsLayout } from "../../../packages/moyaforge-ui/src/components/Layout/DocsLayout/DocsLayout.tsx";
import { DocumentationSite } from "../../../packages/moyaforge-ui/src/components/Layout/DocumentationSite/DocumentationSite.tsx";
import { DocsShellFocused } from "../../../packages/moyaforge-ui/src/components/DocsShellFocused/index.ts";
import { DocsShellWide } from "../../../packages/moyaforge-ui/src/components/DocsShellWide/index.ts";
import { DocumentationLink } from "@moyarich/moyaforge/headless";
import { InlineCodePreview } from "../../../packages/moyaforge-ui/src/components/CodePreview/InlineCodePreview.js";
import { CodePreview } from "../../../packages/moyaforge-ui/src/components/CodePreview/CodePreview.tsx";

import componentModules from "virtual:moyaforge-mdx/code-preview-components";

const examples = Object.fromEntries(
  Object.entries(componentModules).map(([key, load]) => [key, lazy(load)]),
);

function PlaygroundInlineCodePreview({
  example,
  children,
  ...preview
}: ComponentProps<typeof InlineCodePreview> & { example?: string }) {
  const Example = example ? examples[example] : undefined;
  if (example && !Example)
    throw new Error(`Unknown preview example: ${example}`);
  return (
    <InlineCodePreview {...preview}>
      {Example ? <Example /> : children}
    </InlineCodePreview>
  );
}

const components = {
  a: DocumentationLink,
  InlineCodePreview: PlaygroundInlineCodePreview,
  CodePreview,
  pre: CodeBlock,
  CodeBlock,
  CustomBlock,
  CodeGroup,
  CodeTab,
  CopyButton,
  Demo,
  NavigationTree,
  Page,
  Search,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarItem,
  SidebarSection,
  Source,
  TableOfContents,
  EditPageLink,
  EmptyState,
  DocOutline,
  SidebarV1,
  DocsLayout,
  DocumentationSite,
  DocsShellFocused,
  DocsShellWide,
  Console,
  Terminal,
  BookOpen,
  Camera,
  Check,
  ChevronRight,
  Code,
  ExternalLink,
  FileText,
  Info,
  SearchIcon,
  Settings,
  TerminalIcon,
};

export function PlaygroundMdxProvider({
  children,
  components: overrides = {},
}: PropsWithChildren<{
  components?: MDXComponents;
}>) {
  return (
    <MDXProvider components={{ ...components, ...overrides }}>
      {children}
    </MDXProvider>
  );
}
