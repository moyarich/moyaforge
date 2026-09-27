import {
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
} from "./components.js";

export const moyaForgeComponents = Object.freeze({
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
});

export function createMdxComponents(defaults = moyaForgeComponents, overrides = {}) {
  return {
    ...defaults,
    ...overrides,
  };
}
