import { CodeBlock } from "../../components/CodeBlock/CodeBlock.js";
import { createElement, lazy, Suspense } from "react";
import { Console, Terminal } from "@moyarich/console";
import type { ComponentType } from "react";
import { CopyButton } from "../../components/CopyButton/CopyButton.js";
import { Demo } from "../../components/Demo/Demo.js";
import { NavigationTree } from "../../components/NavigationTree/NavigationTree.js";
import { Page } from "../../components/Page/Page.js";
import { Search } from "../../components/Search/Search.js";
import { Sidebar } from "../../components/SidebarV2/Sidebar.js";
import { SidebarContent } from "../../components/SidebarV2/SidebarContent.js";
import { SidebarFooter } from "../../components/SidebarV2/SidebarFooter.js";
import { SidebarGroup } from "../../components/SidebarV2/SidebarGroup.js";
import { SidebarHeader } from "../../components/SidebarV2/SidebarHeader.js";
import { SidebarItem } from "../../components/SidebarV2/SidebarItem.js";
import { SidebarSection } from "../../components/SidebarV2/SidebarSection.js";
import { Source } from "../../components/Source/Source.js";
import { TableOfContents } from "../../components/TableOfContents/TableOfContents.js";
import { CodeGroup, CodeTab } from "../../components/CodeGroup/CodeGroup.js";
import { EditPageLink } from "../../components/EditPageLink/EditPageLink.js";
const LazyMonacoCodeGroup = lazy(() =>
  import("../../components/Monaco/MonacoCodeGroup.js").then((module) => ({
    default: module.MonacoCodeGroup,
  })),
);
function MonacoCodeGroup(
  props: React.ComponentProps<typeof LazyMonacoCodeGroup>,
) {
  return createElement(
    Suspense,
    { fallback: createElement("p", { role: "status" }, "Loading editor…") },
    createElement(LazyMonacoCodeGroup, props),
  );
}
import { DocOutline } from "../../components/DocOutline/DocOutline.js";

export const moyaForgeComponents = Object.freeze({
  pre: CodeBlock,
  CodeBlock,
  Console,
  Terminal,
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
  CodeGroup,
  CodeTab,
  EditPageLink,
  DocOutline,
  MonacoCodeGroup,
});

export type MdxComponents = Record<string, ComponentType<any>>;

export function createMdxComponents(
  defaults: MdxComponents = moyaForgeComponents,
  overrides: MdxComponents = {},
): MdxComponents {
  return { ...defaults, ...overrides };
}
