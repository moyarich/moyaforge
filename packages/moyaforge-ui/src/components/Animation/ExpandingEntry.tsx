"use client";

import "./Animation.css";
import { useReducedMotion } from "motion/react";
import { useSyncExternalStore, type ReactNode } from "react";
import type { AnimationSequence } from "./AnimationSequence.js";

/** Reveal layout space as the corresponding sequential entry becomes active. */
export function ExpandingEntry({
  index,
  sequence,
  children,
}: {
  index: number;
  sequence: AnimationSequence;
  children: ReactNode;
}) {
  const active = useSyncExternalStore(
    sequence.subscribe,
    sequence.snapshot,
    () => 0,
  );
  const reducedMotion = useReducedMotion();
  return (
    <div
      className={[
        "mf-animation-expanding-entry",
        active >= index || !!reducedMotion ? "is-expanded" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div>{children}</div>
    </div>
  );
}
