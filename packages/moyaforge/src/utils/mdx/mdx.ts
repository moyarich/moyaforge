import { Console, Terminal } from "@moyarich/console";
import type { ComponentType } from "react";
import {
  CopyButton, Demo, NavigationTree, Page, Search, Sidebar, SidebarContent,
  SidebarFooter, SidebarGroup, SidebarHeader, SidebarItem, SidebarSection,
  Source, TableOfContents,
} from "../../components/index.js";

export const moyaForgeComponents = Object.freeze({
  Console, Terminal,
  CopyButton, Demo, NavigationTree, Page, Search, Sidebar, SidebarContent,
  SidebarFooter, SidebarGroup, SidebarHeader, SidebarItem, SidebarSection,
  Source, TableOfContents,
});

export type MdxComponents = Record<string, ComponentType<any>>;

export function createMdxComponents(
  defaults: MdxComponents = moyaForgeComponents,
  overrides: MdxComponents = {},
): MdxComponents {
  return { ...defaults, ...overrides };
}
