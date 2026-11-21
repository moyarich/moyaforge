"use client";

import { clsx } from "clsx";
import { Children, createElement, isValidElement, useState } from "react";
import type { AnimationProps, AnimationGroupProps } from "./Animation.types.js";
import { Animation } from "./Animation.js";
import { AnimatedEntry } from "./AnimatedEntry.js";
import { AnimationSequence } from "./AnimationSequence.js";
import { ExpandingEntry } from "./ExpandingEntry.js";

/**
 * Coordinate Animation children without manually assigning sequence indices.
 * Each child controls its own effect and duration. Change the group's React
 * key to reset sequence progress and replay all entries.
 *
 * @example
 * <AnimationGroup sequence stagger={0.15}>
 *   <Animation effect="fade"><strong>Ready</strong></Animation>
 *   <Animation effect="typewriter"><p>Start writing.</p></Animation>
 * </AnimationGroup>
 */
export function AnimationGroup({
  sequence: sequential = false,
  expand = false,
  className,
  stagger = 0,
  wait = 0,
  children,
}: AnimationGroupProps) {
  const [sequence] = useState(() => new AnimationSequence());
  const [completed] = useState(() => new Set<string>());
  let index = 0;
  const entries = Children.map(children, (child) => {
    if (!isValidElement<AnimationProps>(child) || child.type !== Animation)
      return child;
    const {
      children: content,
      className: entryClassName,
      ...options
    } = child.props;
    const entryIndex = index++;
    const entry = createElement(AnimatedEntry, {
      index: entryIndex,
      className: entryClassName,
      sequence,
      completed,
      options: {
        ...options,
        wait: options.wait ?? wait,
        stagger,
        sequence: sequential,
      },
      children: content,
    });
    return expand && sequential ? (
      <ExpandingEntry index={entryIndex} sequence={sequence}>
        {entry}
      </ExpandingEntry>
    ) : (
      entry
    );
  });
  const groupClassName = clsx(className);
  return groupClassName ? (
    <div className={groupClassName}>{entries}</div>
  ) : (
    entries
  );
}
