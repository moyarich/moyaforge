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
import { PreviewCodeInline } from "../../../packages/moyaforge-ui/src/components/PreviewCode/PreviewCodeInline.js";
import { PreviewCode } from "../../../packages/moyaforge-ui/src/components/PreviewCode/PreviewCode.tsx";

import componentModules from "virtual:moyaforge-mdx/preview-code-components";

const examples = new Map<string, ReturnType<typeof lazy>>();

/** Stable lazy component for the registered file and optional #NamedExport. */
function resolvePreviewExample(reference: string) {
  const hash = reference.lastIndexOf("#");
  const moduleKey = hash < 0 ? reference : reference.slice(0, hash);
  const exportName = hash < 0 ? "default" : reference.slice(hash + 1);
  const load = componentModules[moduleKey];
  if (!load) return undefined;

  let Example = examples.get(reference);
  if (!Example) {
    Example = lazy(async () => {
      const module = await load();
      const component = module[exportName];
      if (!component)
        throw new Error(`Missing preview export "${exportName}" in "${moduleKey}".`);
      return { default: component };
    });
    examples.set(reference, Example);
  }
  return Example;
}

function PreviewCodeInlinePlayground({
  component,
  children,
  ...preview
}: ComponentProps<typeof PreviewCodeInline> & { component?: string }) {
  const Example = component ? resolvePreviewExample(component) : undefined;
  if (component && !Example)
    throw new Error(`Unknown preview component: ${component}`);
  return (
    <PreviewCodeInline {...preview}>
      {Example ? <Example /> : children}
    </PreviewCodeInline>
  );
}

const components = {
  a: DocumentationLink,
  PreviewCodeInline: PreviewCodeInlinePlayground,
  PreviewCode,
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
