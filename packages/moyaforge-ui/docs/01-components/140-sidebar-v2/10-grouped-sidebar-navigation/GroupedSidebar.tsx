import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarSection,
  SidebarGroup,
  SidebarItem,
  SidebarFooter,
} from "../../../../src/components/SidebarV2/index.js";

interface NavigationEntry {
  id: string;
  title: string;
  children?: NavigationEntry[];
}

const groups: NavigationEntry[] = [
  {
    id: "guide",
    title: "Guide",
    children: [
      { id: "overview", title: "Overview" },
      {
        id: "installation",
        title: "Installation",
        children: [
          {
            id: "frameworks",
            title: "Frameworks",
            children: [
              { id: "vite", title: "Vite" },
              { id: "nextjs", title: "Next.js" },
            ],
          },
        ],
      },
      { id: "configuration", title: "Configuration" },
    ],
  },
  {
    id: "components",
    title: "Components",
    children: [
      {
        id: "sidebar",
        title: "Sidebar",
        children: [
          {
            id: "navigation",
            title: "Navigation",
            children: [
              { id: "nested-groups", title: "Nested groups" },
              { id: "selection", title: "Active selection" },
            ],
          },
          { id: "styling", title: "Styling" },
        ],
      },
      { id: "search", title: "Search" },
    ],
  },
];

export default function GroupedSidebar() {
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [selected, setSelected] = useState("overview");

  // Compose nested groups recursively; each group keeps independent disclosure state.
  function renderEntry(entry: NavigationEntry): ReactNode {
    if (!entry.children?.length) {
      return (
        <SidebarItem
          key={entry.id}
          active={selected === entry.id}
          onSelect={() => setSelected(entry.id)}
        >
          {entry.title}
        </SidebarItem>
      );
    }
    const expanded = !collapsed.includes(entry.id);
    const Chevron = expanded ? ChevronDown : ChevronRight;
    return (
      <SidebarGroup
        key={entry.id}
        label={entry.title}
        count={entry.children.length}
        icon={<Chevron aria-hidden="true" />}
        expanded={expanded}
        onToggle={() =>
          setCollapsed((previous) =>
            expanded
              ? [...previous, entry.id]
              : previous.filter((id) => id !== entry.id),
          )
        }
      >
        {entry.children.map(renderEntry)}
      </SidebarGroup>
    );
  }

  return (
    <Sidebar aria-label="Sample navigation">
      <SidebarHeader>Documentation</SidebarHeader>
      <SidebarContent>
        {groups.map((group) => (
          <SidebarSection key={group.id}>{renderEntry(group)}</SidebarSection>
        ))}
      </SidebarContent>
      <SidebarFooter>Component registry</SidebarFooter>
    </Sidebar>
  );
}
