"use client";

import { clsx } from "clsx";
import { motion, useReducedMotion } from "motion/react";
import { createElement, useEffect, useSyncExternalStore } from "react";
import type { AnimationEntryProps } from "./Animation.types.js";
import { getAnimationDelay } from "./getAnimationDelay.js";

/** Render opacity, slide, and reveal effects while coordinating sequence progress. */
export function MotionEntry({
  id,
  index,
  completed,
  sequence,
  options,
  className,
  children,
}: AnimationEntryProps) {
  const reducedMotion = useReducedMotion();
  const active =
    useSyncExternalStore(sequence.subscribe, sequence.snapshot, () => 0) >=
    index;
  const ready = !options.sequence || active;
  const alreadyCompleted = id !== undefined && completed.has(id);
  useEffect(() => {
    if (ready && (reducedMotion || alreadyCompleted)) sequence.complete(index);
  }, [ready, reducedMotion, alreadyCompleted, sequence, index]);
  const visible = ready || reducedMotion || alreadyCompleted;
  const effect = options.effect ?? "fade-slide";
  const distance = options.distance ?? 12;
  const initial =
    effect === "fade"
      ? { opacity: 0 }
      : effect === "slide"
        ? { y: distance }
        : effect === "reveal"
          ? { clipPath: "inset(0 100% 0 0)" }
          : { opacity: 0, y: distance };
  const animate =
    effect === "fade"
      ? { opacity: 1 }
      : effect === "slide"
        ? { y: 0 }
        : effect === "reveal"
          ? { clipPath: "inset(0 0% 0 0)" }
          : { opacity: 1, y: 0 };
  return createElement(motion.div, {
    initial: reducedMotion || alreadyCompleted ? false : initial,
    animate: visible ? animate : initial,
    transition: {
      ease: effect === "fade" ? "easeInOut" : "easeOut",
      duration:
        reducedMotion || alreadyCompleted
          ? 0
          : Math.max(0, options.duration ?? 0.3),
      delay:
        reducedMotion || alreadyCompleted
          ? 0
          : getAnimationDelay(
              index,
              options.sequence,
              options.wait,
              options.stagger,
            ),
    },
    onAnimationComplete: () => {
      if (ready) {
        if (id !== undefined) completed.add(id);
        sequence.complete(index);
      }
    },
    style: {
      visibility: options.sequence && !visible ? "hidden" : undefined,
      overflow:
        effect === "reveal" && !reducedMotion && !alreadyCompleted
          ? "hidden"
          : undefined,
    },
    className: clsx(className) || undefined,
    children,
  });
}
