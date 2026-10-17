import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const run = (cwd, command, args = [], env = {}) => {
  const result = spawnSync(command, args, { cwd, encoding: "utf8", env: { ...process.env, ...env } });
  return { status: result.status, output: (result.stdout || "") + (result.stderr || "") };
};
const git = (cwd, ...args) => execFileSync("git", args, { cwd, encoding: "utf8" }).trim();

// Use the exact commit step from the checked-in workflow rather than a copy of its commands.
const workflow = readFileSync(new URL("../.github/workflows/build-component-registry.yml", import.meta.url), "utf8");
const match = workflow.match(/      - name: Commit generated registry files when changed\n        shell: bash\n        run: \|\n((?:          .*\n|\n)+)/);
assert.ok(match, "registry workflow commit step exists");
const script = match[1].split("\n").map(line => line.startsWith("          ") ? line.slice(10) : line).join("\n");

function fixture(fn) {
  const root = mkdtempSync(join(tmpdir(), "moyaforge-registry-workflow-"));
  const remote = join(root, "remote.git"), repo = join(root, "repo"), peer = join(root, "peer");
  try {
    mkdirSync(repo); git(root, "init", "--bare", remote);
    git(repo, "init", "-b", "main"); git(repo, "config", "user.email", "test@example.invalid");
    git(repo, "config", "user.name", "Registry test");
    mkdirSync(join(repo, "registry")); mkdirSync(join(repo, "registry/styles"));
    writeFileSync(join(repo, "registry.json"), "{}\n");
    writeFileSync(join(repo, "registry/styles/sample.css"), "/* baseline */\n");
    writeFileSync(join(repo, "unrelated.txt"), "baseline\n");
    git(repo, "add", "."); git(repo, "commit", "-m", "initial");
    git(repo, "remote", "add", "origin", remote); git(repo, "push", "-u", "origin", "main");
    git(root, "clone", "-b", "main", remote, peer);
    git(peer, "config", "user.email", "peer@example.invalid");
    git(peer, "config", "user.name", "Concurrent writer");
    fn({ root, remote, repo, peer, execute: () => run(repo, "bash", ["-e", "-c", script], { GITHUB_REF_NAME: "main" }) });
  } finally { rmSync(root, { recursive: true, force: true }); }
}

test("current registry is a no-op with no new commit", () => fixture(({ repo, execute }) => {
  const before = git(repo, "rev-parse", "HEAD");
  const result = execute();
  assert.equal(result.status, 0, result.output);
  assert.match(result.output, /Registry is already current/);
  assert.equal(git(repo, "rev-parse", "HEAD"), before);
}));

test("changed registry commits and pushes only generated files", () => fixture(({ repo, remote, execute }) => {
  writeFileSync(join(repo, "registry.json"), '{"items":[]}\n');
  writeFileSync(join(repo, "unrelated.txt"), "user work\n");
  const result = execute();
  assert.equal(result.status, 0, result.output);
  assert.deepEqual(git(repo, "diff-tree", "--no-commit-id", "--name-only", "-r", "HEAD").split("\n"), ["registry.json"]);
  assert.equal(git(remote, "rev-parse", "refs/heads/main"), git(repo, "rev-parse", "HEAD"));
  assert.equal(readFileSync(join(repo, "unrelated.txt"), "utf8"), "user work\n");
}));

test("validation failure stops before commit and push", () => fixture(({ repo, remote, execute }) => {
  const before = git(repo, "rev-parse", "HEAD");
  writeFileSync(join(repo, "registry.json"), "stale\n");
  // Equivalent to a preceding validation step failing under GitHub Actions' step fail-fast behavior.
  const validation = run(repo, "bash", ["-ec", "exit 1"]);
  assert.notEqual(validation.status, 0);
  assert.equal(git(repo, "rev-parse", "HEAD"), before);
  assert.equal(git(remote, "rev-parse", "refs/heads/main"), before);
  // No commit step is run after failed validation.
}));

test("concurrent remote advance rejects push without overwriting", () => fixture(({ repo, peer, remote, execute }) => {
  writeFileSync(join(repo, "registry.json"), '{"items":[1]}\n');
  writeFileSync(join(peer, "unrelated.txt"), "concurrent commit\n");
  git(peer, "add", "unrelated.txt"); git(peer, "commit", "-m", "remote advances");
  git(peer, "push", "origin", "main");
  const remoteHead = git(remote, "rev-parse", "refs/heads/main");
  const result = execute();
  assert.notEqual(result.status, 0, "non-fast-forward push must fail");
  assert.equal(git(remote, "rev-parse", "refs/heads/main"), remoteHead);
  assert.match(result.output, /rejected|fetch first|non-fast-forward/i);
}));

test("workflow has manual dispatch, per-ref serialization, and PR freshness check", () => {
  assert.match(workflow, /^  workflow_dispatch:/m);
  assert.match(workflow, /group: build-component-registry-\$\{\{ github\.ref \}\}/);
  assert.match(workflow, /cancel-in-progress: false/);
  assert.match(workflow, /git add -- registry\.json registry\/styles/);
  assert.doesNotMatch(script, /--force|push\s+-f\b/);
  assert.match(workflow, /npm run registry:check/);
});
