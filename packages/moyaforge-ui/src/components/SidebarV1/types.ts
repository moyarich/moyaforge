/** Minimal navigation data consumed by the installable sidebar. */
export interface SidebarNavigationNode {
  path: string;
  page?: {
    path: string;
    label: string;
  };
  children: SidebarNavigationNode[];
}
