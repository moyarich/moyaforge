import "./SidebarOutline.css";
import "./SidebarItem.css";
import type { ReactNode } from "react";

/** A nested outline node; omit id for a non-selectable parent. */
export interface SidebarOutlineItem {
  id?: string;
  label: string;
  children?: readonly SidebarOutlineItem[];
}

/** Controlled outline selection and label rendering. */
export interface SidebarOutlineProps {
  /** Nested items to display. */
  items: readonly SidebarOutlineItem[];
  /** Selected item ID. */
  value?: string;
  /** Remove this prefix from default labels. */
  labelPrefix?: string;
  /** Called with the selected item ID. */
  onChange: (id: string) => void;
  /** Override the label rendering. */
  renderLabel?: (item: SidebarOutlineItem) => ReactNode;
}

function getLabel(item: SidebarOutlineItem, labelPrefix?: string) {
  if (labelPrefix && item.label.startsWith(labelPrefix)) {
    return item.label.slice(labelPrefix.length);
  }
  return item.label;
}

/** Render nested outline buttons; the host handles navigation in onChange. */
export function SidebarOutline({
  items,
  value,
  labelPrefix,
  onChange,
  renderLabel,
}: SidebarOutlineProps) {
  return (
    <div className="mf-sidebar-v2-outline" data-moyaforge-sidebar-outline="">
      {items.map((item, index) => {
        const key = item.id ?? `${item.label}:${index}`;
        return (
          <div
            className="mf-sidebar-v2-outline-entry"
            data-moyaforge-sidebar-outline-entry=""
            key={key}
          >
            {item.id ? (
              <button
                className="mf-sidebar-v2-item"
                type="button"
                data-moyaforge-sidebar-item=""
                aria-current={item.id === value ? "location" : undefined}
                onClick={() => onChange(item.id!)}
              >
                {renderLabel ? renderLabel(item) : getLabel(item, labelPrefix)}
              </button>
            ) : null}
            {item.children?.length ? (
              <div
                className="mf-sidebar-v2-outline-children"
                data-moyaforge-sidebar-children=""
              >
                <SidebarOutline
                  items={item.children}
                  value={value}
                  labelPrefix={labelPrefix}
                  onChange={onChange}
                  renderLabel={renderLabel}
                />
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
