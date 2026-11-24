import "./CollapsibleDocsOutline.css";
import { useId } from "react";
import { BookOpen } from "lucide-react";
import { DocsLayout } from "../../../../src/components/Layout/DocsLayout/DocsLayout.js";

export default function CollapsibleDocsOutline() {
  const prefix = useId();
  const setupId = `${prefix}-setup`;
  const firstPageId = `${prefix}-first-page`;
  const publishId = `${prefix}-publish`;

  return (
    <div className="collapsible-outline-example">
      <DocsLayout
        title="Team handbook"
        header={
          <div className="collapsible-outline-brand">
            <BookOpen aria-hidden="true" />
            <strong>Team handbook</strong>
            <span>Quickstart guide</span>
          </div>
        }
        pages={[]}
        sidebar={null}
        outline={null}
        toc={{
          placement: "inline",
          label: "Explore this guide",
          collapsible: true,
          defaultOpen: false,
          headings: [
            {
              id: setupId,
              text: "Set up your workspace",
              depth: 2,
              children: [
                { id: firstPageId, text: "Create your first page", depth: 3 },
              ],
            },
            { id: publishId, text: "Review and publish", depth: 2 },
          ],
        }}
      >
        <p className="collapsible-outline-eyebrow">
          Getting started · 3 min read
        </p>
        <h1>A small guide, ready to share</h1>
        <p className="collapsible-outline-intro">
          Open “Explore this guide” above to see its sections. Collapse it again
          when you want more room to read.
        </p>
        <section>
          <h2 id={setupId}>Set up your workspace</h2>
          <p>
            Start with the project’s documentation template. Install its
            dependencies and run the development server so you can review
            changes as you write.
          </p>
          <h3 id={firstPageId}>Create your first page</h3>
          <p>
            Choose a descriptive title, explain one useful task, and include a
            complete example. The outline uses the same heading IDs as the
            article.
          </p>
        </section>
        <section>
          <h2 id={publishId}>Review and publish</h2>
          <p>
            Follow the guide from beginning to end. Check the links, try the
            code, and share the page once each step works.
          </p>
        </section>
      </DocsLayout>
    </div>
  );
}
