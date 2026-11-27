import { test } from "vitest";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import {
  createDiagnostic, createCodeFrame, DiagnosticCollector,
  formatGitHubActionsDiagnostic, formatJsonDiagnostics,
  discoverContent, MdxDiagnosticsError,
} from "../../dist/index.js";

test("diagnostics preserve authored CRLF positions and original error details", async () => {
  const source = await readFile(new URL("../fixtures/positions/crlf.mdx", import.meta.url), "utf8");
  const error = Object.assign(new Error("Invalid expression"), {
    line: 3, column: 6, source: "micromark", ruleId: "acorn",
  });
  const diagnostic = createDiagnostic(error, {
    code: "MDX_PARSE_FAILED", phase: "parse",
    location: { file: "docs/page.mdx" }, source,
  });
  assert.equal(diagnostic.location.line, 3);
  assert.equal(diagnostic.location.column, 6);
  assert.equal(diagnostic.plugin, "micromark");
  assert.match(diagnostic.frame, /> 3 \| \{bad expression\}/);
  assert.match(diagnostic.frame, /\^/);
  assert.equal(createCodeFrame(source, 99), undefined);
  assert.equal(JSON.parse(formatJsonDiagnostics([diagnostic]))[0].code, diagnostic.code);
});

test("annotations escape authored data and property delimiters", () => {
  const diagnostic = createDiagnostic(new Error("Bad%\n::warning::injected"), {
    code: "INVALID", phase: "parse",
    location: { file: "docs/a,b:c.mdx", line: 2, column: 5 },
  });
  const annotation = formatGitHubActionsDiagnostic(diagnostic);
  assert.match(annotation, /^::error file=docs\/a%2Cb%3Ac\.mdx,title=INVALID,line=2,col=5::/);
  assert.ok(annotation.includes("Bad%25%0A::warning::injected"));
  assert.ok(!annotation.includes("\n"));
});

test("collector counts errors and warnings separately", () => {
  const collector = new DiagnosticCollector();
  for (const severity of ["warning", "error"]) {
    collector.add(createDiagnostic("Bad value", {
      code: "INVALID", phase: "parse", severity, location: { file: "page.mdx" },
    }));
  }
  assert.equal(collector.errorCount, 1);
  assert.equal(collector.warningCount, 1);
  assert.throws(() => collector.throwIfErrors(), MdxDiagnosticsError);
});

test("discovery reports multiple malformed pages, with authored filenames", async () => {
  const root = fileURLToPath(new URL("../fixtures/discovery/", import.meta.url));
  const config = {
    sources: { docs: { base: ".", include: ["*.mdx"], pageFiles: "all" } },
    githubActionsAnnotations: false,
  };
  await assert.rejects(discoverContent(config, root), error => {
    assert.ok(error instanceof MdxDiagnosticsError);
    assert.equal(error.diagnostics.length, 2);
    assert.deepEqual(error.diagnostics.map(d => d.location.file), [
      join(root, "invalid-a.mdx"), join(root, "invalid-b.mdx"),
    ]);
    assert.ok(error.diagnostics.every(d => d.location.line === 3 && d.frame));
    return true;
  });
  await assert.rejects(discoverContent({ ...config, collectDiagnostics: false }, root),
    error => error.diagnostics?.length === 1);
});
