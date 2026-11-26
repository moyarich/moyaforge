"use client";

import { createElement } from "react";
import type { AnimationEntryProps } from "./Animation.types.js";
import { TypewriterEntry } from "./TypewriterEntry.js";
import { MotionEntry } from "./MotionEntry.js";

/** Dispatch a low-level entry to the motion or typewriter renderer. */
export function AnimatedEntry(props: AnimationEntryProps) {
  return props.options.effect === "typewriter"
    ? createElement(TypewriterEntry, props)
    : createElement(MotionEntry, props);
}
