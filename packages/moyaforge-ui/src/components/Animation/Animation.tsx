"use client";

import { createElement, useState } from "react";
import type { AnimationProps } from "./Animation.types.js";
import { AnimationSequence } from "./AnimationSequence.js";
import { AnimatedEntry } from "./AnimatedEntry.js";

/**
 * Animate a single element, respecting the user's reduced-motion preference.
 * Change its React key to remount and replay the effect.
 *
 * @example
 * <Animation effect="fade" duration={1.6} wait={2}>
 *   <p>Welcome to your workspace.</p>
 * </Animation>
 */
export function Animation({ children, className, ...options }: AnimationProps) {
  const [sequence] = useState(() => new AnimationSequence());
  const [completed] = useState(() => new Set<string>());
  return createElement(AnimatedEntry, {
    index: 0,
    className,
    sequence,
    completed,
    options,
    children,
  });
}
