import { expect, test } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { RegistryRouteView } from "../packages/moyaforge/src/components/Routing/RegistryRoutes.js";

const routes = [
  { path: "/docs", source: "docs", file: "index.mdx", navigation: "visible" },
  { path: "/docs/hidden", source: "docs", file: "hidden.mdx", navigation: "hidden" },
  { path: "/docs/disabled", source: "docs", file: "disabled.mdx", navigation: "disabled" },
];
const loader = async () => ({ default: () => createElement("p", null, "Loaded MDX") });
const sources = { docs: { lazyPages: {
  "index.mdx": loader,
  "hidden.mdx": loader,
  "disabled.mdx": loader,
} } };

function render(path: string, basename?: string) {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={[path]} basename={basename}>
      <Routes>
        <Route path="/dashboard" element={<p>Host dashboard</p>} />
        <Route path="/docs/*" element={<RegistryRouteView
          routes={routes as any}
          sources={sources}
          notFound={<p>Missing documentation</p>}
          fallback={<p>Loading documentation</p>}
        />} />
      </Routes>
    </MemoryRouter>
  );
}

test("host app routes remain owned by the host router", () => {
  expect(render("/dashboard")).toContain("Host dashboard");
  expect(render("/dashboard")).not.toContain("Missing documentation");
});

test("nested hidden MDX pages remain routable", () => {
  const html = render("/docs/hidden");
  expect(html).not.toContain("Missing documentation");
  expect(html).toContain("Loading documentation");
});

test("disabled MDX pages are not publicly routable", () => {
  expect(render("/docs/disabled")).toContain("Missing documentation");
});

test("React Router basename and trailing slash use the same route metadata", () => {
  expect(render("/app/docs/hidden/", "/app")).not.toContain("Missing documentation");
  expect(render("/app/docs/disabled", "/app")).toContain("Missing documentation");
});
