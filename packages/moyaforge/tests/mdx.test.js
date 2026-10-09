import assert from "node:assert/strict";
import test from "node:test";

import { Console, Terminal } from "@moyarich/console";
import { moyaForgeComponents } from "../dist/utils/mdx/index.js";

test("default MDX components include Console output surfaces", () => {
  assert.equal(moyaForgeComponents.Console, Console);
  assert.equal(moyaForgeComponents.Terminal, Terminal);
});

test("MDX default registry exports documentation components", () => {
  for (const name of ["CodeGroup", "CodeTab", "DocOutline", "EditPageLink", "MonacoCodeGroup"]) {
    assert.equal(typeof moyaForgeComponents[name], "function", name);
  }
});
