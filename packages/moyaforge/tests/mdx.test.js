import assert from "node:assert/strict";
import test from "node:test";

import { Console, Terminal } from "@moyarich/console";
import { moyaForgeComponents } from "../dist/utils/mdx/index.js";

test("default MDX components include Console output surfaces", () => {
  assert.equal(moyaForgeComponents.Console, Console);
  assert.equal(moyaForgeComponents.Terminal, Terminal);
});
