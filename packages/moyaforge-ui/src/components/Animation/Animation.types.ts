import type { ClassValue } from "clsx";
import type { ReactNode } from "react";
import type { AnimationSequence } from "./AnimationSequence.js";

/** Timing and visual settings shared by animation entries. */
export interface AnimationOptions {
  /** Visual effect. Typewriter is intended for static text. @default "fade-slide" */
  effect?: "fade" | "slide" | "fade-slide" | "reveal" | "typewriter";
  /** Wait for earlier entries to finish when used by a sequence. @default false */
  sequence?: boolean;
  /** Effect duration in seconds. Negative values are clamped to zero. @default 0.3 */
  duration?: number;
  /** Delay in seconds before starting; applied to the first sequential entry. @default 0 */
  wait?: number;
  /** Gap in seconds between sequential entries, or per-index delay otherwise. @default 0 */
  stagger?: number;
  /** Vertical offset in pixels for slide and fade-slide effects. @default 12 */
  distance?: number;
}

/** Shared props for low-level motion and typewriter entries. */
export interface AnimationEntryProps {
  /** Class names accepted by clsx. */
  className?: ClassValue;
  /** Stable identity used to retain completion within a mounted group. */
  id?: string;
  /** Zero-based position in the shared sequence. */
  index: number;
  /** Completion identities owned by the parent group. */
  completed: Set<string>;
  /** Shared progress store used to release sequential entries. */
  sequence: AnimationSequence;
  /** Visual effect and timing for this entry. */
  options: AnimationOptions;
  /** Content to animate. */
  children: ReactNode;
}

/** Props for an independent animated element. */
export type AnimationProps = Pick<
  AnimationOptions,
  "effect" | "duration" | "distance" | "wait"
> & {
  /** Content to animate. Static text is recommended for typewriter effects. */
  children: ReactNode;
  /** Class names accepted by clsx and applied to the wrapping element. */
  className?: ClassValue;
};

/** Props for coordinating direct Animation children. */
export interface AnimationGroupProps {
  /** Class names accepted by clsx and applied to the group's wrapper. */
  className?: ClassValue;
  /** Reveal each sequential entry's layout as it starts. @default false */
  expand?: boolean;
  /** Wait for each entry to complete before starting the next. @default false */
  sequence?: boolean;
  /** Gap in seconds between sequential entries, or per-index delay otherwise. @default 0 */
  stagger?: number;
  /** Default delay in seconds for children without their own wait. @default 0 */
  wait?: number;
  /** Animation elements placed directly inside the group. */
  children: ReactNode;
}
