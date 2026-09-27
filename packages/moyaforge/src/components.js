import React from "react";

const h = React.createElement;

export function CopyButton({ value, children = "Copy", onCopy, ...props }) {
  async function copy() {
    await navigator.clipboard.writeText(String(value ?? ""));
    onCopy?.();
  }

  return h("button", { type: "button", onClick: copy, ...props }, children);
}

export function NavigationTree({
  items,
  renderLink,
  listProps,
  itemProps,
}) {
  return h(
    "ul",
    listProps,
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
    { "data-language": language, ...props },
    h("code", null, children ?? code),
  );
}

export function Demo({ children, ...props }) {
  return h("div", { "data-moyaforge-demo": "", ...props }, children);
}

export function Page({ as = "main", children, ...props }) {
  return h(as, props, children);
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
    { "aria-label": "Table of contents", ...props },
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
