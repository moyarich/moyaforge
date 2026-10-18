import { appendFileSync, existsSync, readFileSync } from "node:fs";

const env = process.env;
const summary = env.GITHUB_STEP_SUMMARY;
if (!summary) {
  console.log("GITHUB_STEP_SUMMARY is unavailable; skipping job summary.");
  process.exit(0);
}
const repository = env.GITHUB_REPOSITORY || "unknown";
const base = (env.GITHUB_SERVER_URL || "https://github.com") + "/" + repository;
const format = (value) => String(value || "not run").replaceAll("|", "\\|");
const lines = [
  "## Component registry generation",
  "",
  "| Detail | Value |",
  "| --- | --- |",
  "| Repository | \`" + repository + "\` |",
  "| Trigger | \`" + (env.GITHUB_EVENT_NAME || "unknown") + "\` |",
  "| Branch | \`" + (env.GITHUB_REF_NAME || "unknown") + "\` |",
  "| Run | [#" +
    (env.GITHUB_RUN_NUMBER || "?") +
    "](" +
    base +
    "/actions/runs/" +
    (env.GITHUB_RUN_ID || "") +
    ") |",
  "| Source revision | [\`" +
    (env.GITHUB_SHA || "").slice(0, 12) +
    "\`](" +
    base +
    "/commit/" +
    (env.GITHUB_SHA || "") +
    ") |",
  "| Runtime | Node.js 24 |",
  "| Schema validator | \`shadcn@4.21.5\` |",
  "",
  "### Verification",
  "",
  "| Stage | Outcome |",
  "| --- | --- |",
  "| Registry and CSS generation | " + format(env.GENERATE_RESULT) + " |",
  "| Registry freshness | " + format(env.FRESHNESS_RESULT) + " |",
  "| shadcn compatibility | " + format(env.SCHEMA_RESULT) + " |",
  "| Generated-only commit and push | " + format(env.COMMIT_RESULT) + " |",
  "",
];
if (env.GENERATE_RESULT === "success" && existsSync("registry.json")) {
  try {
    const data = JSON.parse(readFileSync("registry.json", "utf8"));
    const items = Array.isArray(data.items) ? data.items : [];
    lines.push(
      "### Discovered registry items",
      "",
      "**" + items.length + " components**",
      "",
    );
    if (items.length) {
      lines.push("<details><summary>Component names</summary>", "");
      for (const item of items)
        lines.push(
          "- \`" + String(item.name || "unnamed").replaceAll("\`", "") + "\`",
        );
      lines.push("", "</details>", "");
    }
  } catch (err) {
    lines.push("Registry item details unavailable: " + String(err.message), "");
  }
}
lines.push("### Git result", "");
if (env.CHANGE_RESULT === "unchanged") {
  lines.push("No generated changes. **No commit or push was needed.**");
} else if (env.CHANGE_RESULT === "committed") {
  const sha = env.COMMIT_SHA || "";
  lines.push(
    "Generated registry files committed and pushed.",
    "",
    "Commit: [\`" + sha.slice(0, 12) + "\`](" + base + "/commit/" + sha + ")",
  );
} else {
  lines.push(
    "No successful commit result was recorded. Consult the stage outcomes and job logs.",
  );
}
lines.push(
  "",
  "Only \`registry.json\` and \`registry/styles/\` may be staged for generated commits.",
  "",
);
appendFileSync(summary, lines.join("\n") + "\n");
console.log("Wrote detailed component registry job summary.");
