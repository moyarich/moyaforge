import { describe, expect, test } from "vitest";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CustomBlock } from "../../src/components/CustomBlock/index.ts";

describe("CustomBlock", () => {
  test("preserves arbitrary directive classes, data attributes and title markup", () => {
    const html = renderToStaticMarkup(h(CustomBlock, {
      className: "warning custom-extra",
      "data-type": "warning",
      id: "example",
    }, h("p", { className: "custom-block-title" }, "Compatibility"), h("p", null, "This API may change.")));
    expect(html).toContain('class="custom-block warning custom-extra"');
    expect(html).toContain('data-type="warning"');
    expect(html).toContain('id="example"');
    expect(html).toContain('class="custom-block-title"');
    expect(html).toContain("This API may change.");
  });

  test("renders nested arbitrary blocks and embedded child content", () => {
    const html = renderToStaticMarkup(
      h(CustomBlock, { className: "experimental", "data-type": "experimental" },
        h(CustomBlock, { className: "my-custom-type", "data-type": "my-custom-type" },
          h("pre", null, h("code", null, "const ready = true;")))));
    expect(html).toContain('class="custom-block experimental"');
    expect(html).toContain('class="custom-block my-custom-type"');
    expect(html).toContain("const ready = true;");
  });

  test("does not invent a type or title", () => {
    const html = renderToStaticMarkup(h(CustomBlock, null, "Content"));
    expect(html).toBe('<div class="custom-block">Content</div>');
  });
});
