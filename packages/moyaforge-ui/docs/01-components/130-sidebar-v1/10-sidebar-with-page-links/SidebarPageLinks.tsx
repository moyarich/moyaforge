import "./SidebarPageLinks.css";
import { useState } from "react";
import { SidebarV1 } from "../../../../src/components/SidebarV1/SidebarV1.js";

export default function SidebarPageLinks() {
  const [currentUrl, setCurrentUrl] = useState("/guide/overview");

  return (
    <SidebarV1
      className="mf-sidebar sidebar-v1-example"
      label="Documentation"
      groups={[
        {
          source: "guide",
          label: "Guide",
          page: { path: "/guide", title: "Guide" },
          collapsible: true,
          nodes: [
            {
              path: "/guide/overview",
              page: { path: "/guide/overview", title: "Overview" },
              children: [],
            },
            {
              path: "/guide/installation",
              page: { path: "/guide/installation", title: "Installation" },
              children: [
                {
                  path: "/guide/installation/frameworks",
                  page: {
                    path: "/guide/installation/frameworks",
                    title: "Frameworks",
                  },
                  children: [
                    {
                      path: "/guide/installation/frameworks/vite",
                      page: {
                        path: "/guide/installation/frameworks/vite",
                        title: "Vite",
                      },
                      children: [],
                    },
                    {
                      path: "/guide/installation/frameworks/nextjs",
                      page: {
                        path: "/guide/installation/frameworks/nextjs",
                        title: "Next.js",
                      },
                      children: [],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          source: "components",
          label: "Components",
          nodes: [
            {
              path: "/components/sidebar",
              page: { path: "/components/sidebar", title: "Sidebar V1" },
              children: [
                {
                  path: "/components/sidebar/navigation",
                  page: {
                    path: "/components/sidebar/navigation",
                    title: "Navigation",
                  },
                  children: [
                    {
                      path: "/components/sidebar/navigation/nested-groups",
                      page: {
                        path: "/components/sidebar/navigation/nested-groups",
                        title: "Nested groups",
                      },
                      children: [],
                    },
                  ],
                },
                {
                  path: "/components/sidebar/styling",
                  page: {
                    path: "/components/sidebar/styling",
                    title: "Styling",
                  },
                  children: [],
                },
              ],
            },
            {
              path: "/components/search",
              page: { path: "/components/search", title: "Search" },
              children: [],
            },
          ],
        },
      ]}
      currentUrl={currentUrl}
      onClickCapture={(event) => {
        const link = (event.target as Element).closest("a[href]");
        if (!link) return;
        // Keep demo navigation inside the preview while updating the active link.
        event.preventDefault();
        setCurrentUrl(link.getAttribute("href")!);
      }}
    />
  );
}
