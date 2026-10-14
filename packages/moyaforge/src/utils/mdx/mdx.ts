import { Console, Terminal } from "@moyarich/console";
import type { ComponentType } from "react";
import { CopyButton } from "../../components/CopyButton/CopyButton.js";
import { Demo } from "../../components/Demo/Demo.js";
import { NavigationTree } from "../../components/NavigationTree/NavigationTree.js";
import { Page } from "../../components/Page/Page.js";
import { Search } from "../../components/Search/Search.js";
import { Sidebar } from "../../components/Sidebar/Sidebar.js";
import { SidebarContent } from "../../components/Sidebar/SidebarContent.js";
import { SidebarFooter } from "../../components/Sidebar/SidebarFooter.js";
import { SidebarGroup } from "../../components/Sidebar/SidebarGroup.js";
import { SidebarHeader } from "../../components/Sidebar/SidebarHeader.js";
import { SidebarItem } from "../../components/Sidebar/SidebarItem.js";
import { SidebarSection } from "../../components/Sidebar/SidebarSection.js";
import { Source } from "../../components/Source/Source.js";
import { TableOfContents } from "../../components/TableOfContents/TableOfContents.js";
import { CodeGroup, CodeTab } from "../../components/CodeGroup/CodeGroup.js";
import { EditPageLink } from "../../components/EditPageLink/EditPageLink.js";
import { MonacoCodeGroup } from "../../components/Monaco/MonacoCodeGroup.js";
import { DocOutline } from "../../components/DocOutline/DocOutline.js";

export const moyaForgeComponents = Object.freeze({
  Console, Terminal,
  CopyButton, Demo, NavigationTree, Page, Search, Sidebar, SidebarContent,
  SidebarFooter, SidebarGroup, SidebarHeader, SidebarItem, SidebarSection,
  Source, TableOfContents, CodeGroup, CodeTab, EditPageLink, DocOutline, MonacoCodeGroup,
});

export type MdxComponents = Record<string, ComponentType<any>>;

export function createMdxComponents(
  defaults: MdxComponents = moyaForgeComponents,
  overrides: MdxComponents = {},
): MdxComponents {
  return { ...defaults, ...overrides };
}
