import { useId, useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { DynamicIcon, iconNames, type IconName } from "lucide-react/dynamic";
import { NavLink } from "react-router-dom";
import type { SidebarNavigationNode } from "./types.js";
import type { DocumentationGroup } from "./SidebarV1.js";

/** Groups and optional host-controlled navigation selection. */
export interface NavigationProps {
  groups: readonly DocumentationGroup[];
  onNavigate?: () => void;
  /** Controlled selection for embedded navigation; otherwise uses the router location. */
  currentUrl?: string;
}
/** Render grouped documentation links; requires a router unless currentUrl is supplied. */
export function Navigation({
  groups,
  onNavigate,
  currentUrl,
}: NavigationProps) {
  const renderNodes = (nodes: SidebarNavigationNode[]): ReactNode =>
    nodes.map((node) => (
      <li key={node.path}>
        {node.page ? (
          <NavigationLink
            className="mf-navigation-row"
            currentUrl={currentUrl}
            to={node.page.path}
            title={node.page.title}
            onClick={() => onNavigate?.()}
          >
            <MenuIcon name={node.page.icon} />
            <span className="mf-navigation-label">{node.page.title}</span>
          </NavigationLink>
        ) : (
          <span className="mf-folder mf-navigation-row">
            <MenuIcon />
            <span className="mf-navigation-label">
              {node.path.split("/").at(-1)?.replace(/[-_]/g, " ")}
            </span>
          </span>
        )}
        {node.children.length > 0 && <ul>{renderNodes(node.children)}</ul>}
      </li>
    ));

  return (
    <nav className="mf-navigation" aria-label="Documentation">
      {groups
        .filter((group) => group.nodes.length || group.page)
        .map((group) => (
          <NavigationGroup
            key={group.source}
            group={group}
            onNavigate={onNavigate}
            currentUrl={currentUrl}
          >
            {renderNodes(group.nodes)}
          </NavigationGroup>
        ))}
    </nav>
  );
}

function NavigationGroup({
  group,
  onNavigate,
  currentUrl,
  children,
}: {
  group: DocumentationGroup;
  onNavigate?: () => void;
  currentUrl?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(group.defaultOpen ?? true);
  const id = useId();
  const collapsible = group.collapsible && group.nodes.length > 0;
  const Chevron = open ? ChevronDown : ChevronRight;
  return (
    <section className="mf-navigation-group">
      <div className="title mf-navigation-group-title">
        {group.page ? (
          <NavigationLink
            className="mf-navigation-row"
            currentUrl={currentUrl}
            to={group.page.path}
            title={group.label}
            onClick={() => onNavigate?.()}
          >
            <MenuIcon name={group.page.icon} />
            <span className="mf-navigation-label">{group.label}</span>
          </NavigationLink>
        ) : (
          <span className="mf-navigation-row">
            <MenuIcon />
            <span className="mf-navigation-label">{group.label}</span>
          </span>
        )}
        {collapsible && (
          <button
            type="button"
            aria-expanded={open}
            aria-controls={id}
            aria-label={`${open ? "Collapse" : "Expand"} ${group.label}`}
            onClick={() => setOpen(!open)}
          >
            <Chevron size={16} aria-hidden="true" focusable="false" />
          </button>
        )}
      </div>
      <ul
        className="mf-navigation-group-items"
        id={id}
        hidden={Boolean(collapsible && !open)}
      >
        {children}
      </ul>
    </section>
  );
}

const supportedIcons = new Set<string>(iconNames);
function MenuIcon({ name }: { name?: string }) {
  const valid = Boolean(name && supportedIcons.has(name));
  return (
    <span className="mf-navigation-icon" aria-hidden="true">
      {valid && (
        <DynamicIcon name={name as IconName} size={16} focusable="false" />
      )}
    </span>
  );
}

/** Use the router by default, or a plain link when selection is controlled by the host. */
function NavigationLink({
  currentUrl,
  to,
  children,
  ...props
}: {
  currentUrl?: string;
  to: string;
  children: ReactNode;
  className: string;
  title: string;
  onClick: () => void;
}) {
  if (currentUrl === undefined)
    return (
      <NavLink {...props} to={to} end>
        {children}
      </NavLink>
    );
  const active = currentUrl === to;
  return (
    <a
      {...props}
      href={to}
      className={`${props.className}${active ? " active" : ""}`}
      aria-current={active ? "page" : undefined}
    >
      {children}
    </a>
  );
}
