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
import { defineMdxComponentRegistry } from "@moyarich/moyaforge/headless";
import { Console, Terminal } from "@moyarich/console";
import { CodeBlock } from "../../../packages/moyaforge-ui/src/components/CodeBlock/index.ts";
import { CodeGroup, CodeTab } from "../../../packages/moyaforge-ui/src/components/CodeGroup/index.ts";
import { CopyButton } from "../../../packages/moyaforge-ui/src/components/CopyButton/index.ts";
import { Demo } from "../../../packages/moyaforge-ui/src/components/Demo/index.ts";
import { NavigationTree } from "../../../packages/moyaforge-ui/src/components/NavigationTree/index.ts";
import { Page } from "../../../packages/moyaforge-ui/src/components/Page/index.ts";
import { Search } from "../../../packages/moyaforge-ui/src/components/Search/index.ts";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarHeader, SidebarItem, SidebarSection } from "../../../packages/moyaforge-ui/src/components/SidebarV2/index.ts";
import { Source } from "../../../packages/moyaforge-ui/src/components/Source/index.ts";
import { TableOfContents } from "../../../packages/moyaforge-ui/src/components/TableOfContents/index.ts";
import { EditPageLink } from "../../../packages/moyaforge-ui/src/components/EditPageLink/index.ts";
import { DocOutline } from "../../../packages/moyaforge-ui/src/components/DocOutline/index.ts";
import { PlaygroundCallout } from "./components/index.js";

const components = defineMdxComponentRegistry({
  pre: CodeBlock,
  CodeBlock, CodeGroup, CodeTab, CopyButton, Demo, NavigationTree, Page,
  Search, Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarHeader,
  SidebarItem, SidebarSection, Source, TableOfContents, EditPageLink, DocOutline,
  Console, Terminal,
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
  Callout: PlaygroundCallout,
});

export function PlaygroundMdxProvider({ children }) {
  return <MDXProvider components={components}>{children}</MDXProvider>;
}
