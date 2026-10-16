import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import type { SidebarNavigationNode } from "./types.js";
import type { DocumentationGroup } from "./SidebarV1.js";

export interface NavigationProps {
  groups: readonly DocumentationGroup[];
  onNavigate?: () => void;
}
export function Navigation({ groups, onNavigate }: NavigationProps) {
  const renderNodes = (nodes: SidebarNavigationNode[]): ReactNode =>
    nodes.map((node) => (
      <li key={node.path}>
        {node.page ? (
          <NavLink end to={node.page.path} onClick={() => onNavigate?.()}>
            {node.page.label}
          </NavLink>
        ) : (
          <span className="mf-folder">
            {node.path.split("/").at(-1)?.replace(/[-_]/g, " ")}
          </span>
        )}
        {node.children.length > 0 && <ul>{renderNodes(node.children)}</ul>}
      </li>
    ));

  return (
    <nav aria-label="Documentation">
      {groups
        .filter((group) => group.nodes.length)
        .map((group) => (
          <section key={group.source}>
            <div className="title">{group.label}</div>
            <ul>{renderNodes(group.nodes)}</ul>
          </section>
        ))}
    </nav>
  );
}
