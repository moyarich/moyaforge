import { useState } from "react";
import {
  Animation,
  AnimationGroup,
} from "../../../src/components/Animation/index.js";

export function AnimationExample() {
  const [run, setRun] = useState(0);
  return (
    <>
      <button type="button" onClick={() => setRun((current) => current + 1)}>
        Replay animation
      </button>
      <AnimationGroup key={run} sequence stagger={0.15}>
        <Animation effect="fade-slide">
          <strong>Build your documentation</strong>
        </Animation>
        <Animation effect="typewriter" duration={1}>
          <p>Start with a Markdown page.</p>
        </Animation>
      </AnimationGroup>
    </>
  );
}
