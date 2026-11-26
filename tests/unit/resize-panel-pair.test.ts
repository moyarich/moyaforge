import { expect, test } from "vitest";
import { resizePanelPair } from "../../packages/moyaforge-ui/src/components/ResizablePanel/resize-panel-pair.js";

const pair = {
  first: 25,
  second: 75,
  firstMin: 15,
  firstMax: 45,
  secondMin: 60,
  secondMax: 80,
};
test("resizing respects the adjacent panel's minimum and maximum", () => {
  expect(resizePanelPair({ ...pair, proposed: 0 })).toEqual([20, 80]);
  expect(resizePanelPair({ ...pair, proposed: 100 })).toEqual([40, 60]);
});
test("resizing a pair in a larger group preserves the other panels' space", () => {
  expect(
    resizePanelPair({
      ...pair,
      first: 20,
      second: 30,
      firstMin: 10,
      firstMax: 40,
      secondMin: 10,
      secondMax: 40,
      proposed: 35,
    }),
  ).toEqual([35, 15]);
});
test("incompatible constraints leave the layout unchanged", () => {
  expect(
    resizePanelPair({ ...pair, firstMin: 50, secondMin: 60, proposed: 50 }),
  ).toBeNull();
});
