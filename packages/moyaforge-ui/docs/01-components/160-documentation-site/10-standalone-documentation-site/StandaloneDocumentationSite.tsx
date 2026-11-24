import { DocumentationSite } from "../../../../src/components/Layout/DocumentationSite/DocumentationSite.js";

export default function StandaloneDocumentationSite() {
  return (
    <DocumentationSite
      title="Example site"
      pages={[{ path: "/ui", title: "Overview" }]}
      currentPath="/ui"
      sidebar={null}
      outline={null}
    >
      <p>Standalone documentation chrome with host-owned routing.</p>
    </DocumentationSite>
  );
}
