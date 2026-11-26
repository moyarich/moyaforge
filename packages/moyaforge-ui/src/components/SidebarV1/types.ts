/** Minimal navigation data consumed by the installable sidebar. */
export interface SidebarNavigationNode {
  path: string;
  page?: {
    path: string;
    title: string;
    icon?: string;
  };
  children: SidebarNavigationNode[];
}
