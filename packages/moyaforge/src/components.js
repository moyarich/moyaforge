import React from "react";

const h = React.createElement;

export function CopyButton({ value, children = "Copy", onCopy, ...props }) {
  async function copy() {
    await navigator.clipboard.writeText(String(value ?? ""));
    onCopy?.();
  }

  return h(
    "button",
    { type: "button", "data-moyaforge-copy-button": "", onClick: copy, ...props },
    children,
  );
}

export function NavigationTree({
  items,
  renderLink,
  listProps,
  itemProps,
}) {
  return h(
    "ul",
    { "data-moyaforge-navigation-tree": "", ...listProps },
    items.map((item) =>
      h(
        "li",
        { key: item.page?.id ?? item.label, ...itemProps },
        item.page && renderLink ? renderLink(item.page, item) : item.label,
        item.children?.length
          ? h(NavigationTree, { items: item.children, renderLink, listProps, itemProps })
          : null,
      ),
    ),
  );
}

export function Source({ code, language, children, ...props }) {
  return h(
    "pre",
    { "data-moyaforge-source": "", "data-language": language, ...props },
    h("code", null, children ?? code),
  );
}

export function Demo({ children, ...props }) {
  return h("div", { "data-moyaforge-demo": "", ...props }, children);
}

export function Page({ as = "main", children, ...props }) {
  return h(as, { "data-moyaforge-page": "", ...props }, children);
}

export function TableOfContents({
  root = typeof document === "undefined" ? null : document,
  selector = "h2[id], h3[id]",
  renderLink,
  ...props
}) {
  const headings = root ? Array.from(root.querySelectorAll(selector)) : [];

  return h(
    "nav",
    { "data-moyaforge-toc": "", "aria-label": "Table of contents", ...props },
    h(
      "ul",
      null,
      headings.map((heading) => {
        const item = {
          id: heading.id,
          label: heading.textContent ?? heading.id,
          level: Number(heading.tagName.slice(1)),
        };

        return h(
          "li",
          { key: item.id, "data-level": item.level },
          renderLink
            ? renderLink(item)
            : h("a", { href: `#${item.id}` }, item.label),
        );
      }),
    ),
  );
}

function SidebarRoot({ as = "nav", children, ...props }) {
  return h(as, { "data-moyaforge-sidebar": "", ...props }, children);
}

export function SidebarHeader({ as = "header", children, ...props }) {
  return h(as, { "data-moyaforge-sidebar-header": "", ...props }, children);
}

export function SidebarContent({ as = "div", children, ...props }) {
  return h(as, { "data-moyaforge-sidebar-content": "", ...props }, children);
}

export function SidebarFooter({ as = "footer", children, ...props }) {
  return h(as, { "data-moyaforge-sidebar-footer": "", ...props }, children);
}

export function SidebarSection({
  as = "section",
  title,
  count,
  header,
  children,
  ...props
}) {
  return h(
    as,
    { "data-moyaforge-sidebar-section": "", ...props },
    header ??
      (title != null
        ? h(
            "header",
            { "data-moyaforge-sidebar-section-header": "" },
            h("strong", null, title),
            count != null
              ? h("span", { "data-moyaforge-sidebar-count": "" }, count)
              : null,
          )
        : null),
    children,
  );
}

export function Search({
  value,
  onChange,
  icon,
  inputProps,
  children,
  ...props
}) {
  return h(
    "label",
    { "data-moyaforge-search": "", ...props },
    icon,
    h("input", {
      type: "search",
      value,
      onChange,
      ...inputProps,
    }),
    children,
  );
}

export function SidebarGroup({
  label,
  count,
  expanded = true,
  onToggle,
  icon,
  children,
  renderTrigger,
  ...props
}) {
  const trigger = {
    label,
    count,
    expanded,
    icon,
    onToggle,
  };

  return h(
    "div",
    { "data-moyaforge-sidebar-group": "", ...props },
    renderTrigger
      ? renderTrigger(trigger)
      : h(
          "button",
          {
            type: "button",
            "aria-expanded": expanded,
            onClick: onToggle,
          },
          icon,
          h("span", null, label),
          count != null ? h("span", null, count) : null,
        ),
    expanded
      ? h("div", { "data-moyaforge-sidebar-children": "" }, children)
      : null,
  );
}

export function SidebarItem({
  active,
  current = "page",
  onSelect,
  children,
  as = "button",
  ...props
}) {
  const elementProps = {
    "aria-current": active ? current : undefined,
    ...props,
  };

  if (as === "button") {
    elementProps.type ??= "button";
    elementProps.onClick = onSelect;
  }

  return h(as, elementProps, children);
}

SidebarRoot.Header = SidebarHeader;
SidebarRoot.Content = SidebarContent;
SidebarRoot.Section = SidebarSection;
SidebarRoot.Footer = SidebarFooter;
SidebarRoot.Group = SidebarGroup;
SidebarRoot.Item = SidebarItem;

export const Sidebar = SidebarRoot;
