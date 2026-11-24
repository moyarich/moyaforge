import "./CustomDocsLayout.css";
import { useState, type MouseEvent } from "react";
import { BookOpen, Layers3 } from "lucide-react";
import { DocsLayout } from "../../../../src/components/Layout/DocsLayout/DocsLayout.js";

const sections = {
  guide: {
    label: "Guide",
    eyebrow: "Documentation that fits your project",
    title: "Make the layout your own",
    introduction:
      "Keep the structure you need and bring your own brand, navigation, and content. DocsLayout supplies the frame; your application owns what goes inside it.",
    heading: "Three places to start",
    cards: [
      {
        title: "Your header",
        text: "Replace the default header with a brand mark, section controls, or project actions.",
      },
      {
        title: "Your content",
        text: "Render articles, components, and interactive examples as children.",
      },
      {
        title: "Your footer",
        text: "Add related links, page information, or a next step with the footer slot.",
      },
    ],
  },
  updates: {
    label: "Release notes",
    eyebrow: "Sample project · Version 2.0",
    title: "A fresh home for the team’s knowledge",
    introduction:
      "This sample release page uses the same header and layout as the guide. Only the content changes when you select another section.",
    heading: "What’s new in this sample",
    cards: [
      {
        title: "Task-focused guides",
        text: "Start with a reader’s goal and finish with a clear next step.",
      },
      {
        title: "Complete examples",
        text: "Keep component source, styles, and setup instructions together.",
      },
      {
        title: "Shared page structure",
        text: "Reuse the header and footer across different kinds of documentation.",
      },
    ],
  },
};

export default function CustomDocsLayout() {
  const [sectionId, setSectionId] = useState<keyof typeof sections>("guide");
  const section = sections[sectionId];

  function selectSection(event: MouseEvent<HTMLButtonElement>) {
    const value = event.currentTarget.value;
    if (value === "guide" || value === "updates") setSectionId(value);
  }

  return (
    <div className="custom-docs-example">
      <DocsLayout
        pages={[]}
        header={
          <div className="custom-docs-header">
            <div className="custom-docs-brand">
              <Layers3 aria-hidden="true" />
              <strong>Atlas</strong>
              <span>Docs</span>
            </div>
            <nav aria-label="Sample documentation sections">
              <button
                type="button"
                value="guide"
                onClick={selectSection}
                aria-current={sectionId === "guide" ? "page" : undefined}
              >
                Guide
              </button>
              <button
                type="button"
                value="updates"
                onClick={selectSection}
                aria-current={sectionId === "updates" ? "page" : undefined}
              >
                Release notes
              </button>
            </nav>
          </div>
        }
        sidebar={null}
        outline={null}
        footer={
          <footer className="custom-docs-footer">
            <BookOpen aria-hidden="true" />
            <span>{section.label} · Example content, local navigation</span>
          </footer>
        }
      >
        <p className="custom-docs-eyebrow">{section.eyebrow}</p>
        <h1>{section.title}</h1>
        <p className="custom-docs-introduction">{section.introduction}</p>
        <section>
          <h2>{section.heading}</h2>
          <div className="custom-docs-cards">
            {section.cards.map((card) => (
              <section key={card.title}>
                <h3>{card.title}</h3>
                <p>{card.text}</p>
              </section>
            ))}
          </div>
        </section>
      </DocsLayout>
    </div>
  );
}
