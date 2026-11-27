import { test, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Card } from "../../src/components/Card/index.js";

test("renders optional metadata, content, variants and DOM attributes", () => {
  const html = renderToStaticMarkup(
    <Card title="Getting started" description="Install first" compact variant="filled" id="intro">
      <a href="/guide">Guide</a>
    </Card>,
  );
  expect(html).toContain('data-variant="filled"');
  expect(html).toContain('data-compact=""');
  expect(html).toContain('id="intro"');
  expect(html).toContain("Getting started");
  expect(html).toContain("Install first");
  expect(html).toContain('href="/guide"');
});

test("renders nested cards with independent spacing and default outline", () => {
  const html = renderToStaticMarkup(<Card><Card compact>Nested</Card></Card>);
  expect(html.match(/data-variant="outline"/g)).toHaveLength(2);
  expect(html.match(/data-compact=""/g)).toHaveLength(1);
  expect(html).not.toContain("mf-card-header");
});
