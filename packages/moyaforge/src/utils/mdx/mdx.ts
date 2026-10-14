import { Console, Terminal } from "@moyarich/console";
import type { ComponentType } from "react";
import { CopyButton } from "../../components/CopyButton/CopyButton.js";
import { Demo } from "../../components/Demo/Demo.js";
import { NavigationTree } from "../../components/NavigationTree/NavigationTree.js";
import { Page } from "../../components/Page/Page.js";
import { Search } from "../../components/Search/Search.js";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
  SidebarHeader, SidebarItem, SidebarSection,
} from "../../components/Sidebar/Sidebar.js";
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
  Source, TableOfContents, CodeGroup, CodeTab, EditPageLink, MonacoCodeGroup,
});

export type MdxComponents = Record<string, ComponentType<any>>;

export function createMdxComponents(
  defaults: MdxComponents = moyaForgeComponents,
  overrides: MdxComponents = {},
): MdxComponents {
  return { ...defaults, ...overrides };
}
