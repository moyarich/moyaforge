import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { Animation, AnimationGroup, AnimationSequence } from "../../packages/moyaforge-ui/src/components/Animation/index.js";

test("Animation retains its content and clsx class values after the file split", () => {
  const html = renderToStaticMarkup(<Animation effect="fade" className={["message", {featured: true}]}><p>Welcome</p></Animation>);
  expect(html).toContain('class="message featured"');
  expect(html).toContain('opacity:0');
  expect(html).toContain('<p>Welcome</p>');
});
test("AnimationGroup recognizes Animation from the public index and gates later entries", () => {
  const html = renderToStaticMarkup(<AnimationGroup sequence expand>
    <Animation effect="fade">First entry</Animation>
    <Animation effect="typewriter">Second entry</Animation>
  </AnimationGroup>);
  expect(html.match(/class="mf-animation-expanding-entry/g)).toHaveLength(2);
  expect(html).toContain('class="mf-animation-expanding-entry is-expanded"');
  expect(html).toContain('visibility:hidden');
  expect(html).toContain('First entry');
  expect(html).toContain('Second entry');
});
test("AnimationSequence advances in order even when entries complete out of order", () => {
  const sequence = new AnimationSequence();
  let notifications = 0;
  const unsubscribe = sequence.subscribe(() => notifications++);
  sequence.complete(1);
  expect(sequence.snapshot()).toBe(0);
  sequence.complete(0);
  expect(sequence.snapshot()).toBe(2);
  expect(notifications).toBe(1);
  unsubscribe();
  sequence.complete(2);
  expect(notifications).toBe(1);
});
