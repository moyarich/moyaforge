"use client";

import "./Animation.css";
import { clsx, type ClassValue } from "clsx";

import { motion, useReducedMotion } from "motion/react";
import {
  Children,
  createElement,
  isValidElement,
  useEffect,
  useLayoutEffect,
  useRef,
  useSyncExternalStore,
  useState,
  type ReactNode,
} from "react";

import { AnimationSequence } from "./AnimationSequence.js";

export interface AnimationOptions {
  effect?: "fade" | "slide" | "fade-slide" | "reveal" | "typewriter";
  sequence?: boolean;
  duration?: number;
  wait?: number;
  stagger?: number;
  distance?: number;
}

function getAnimationDelay(
  index: number,
  sequence = false,
  wait = 0,
  stagger = 0,
) {
  const gap = Math.max(0, stagger);
  if (sequence && index > 0) return gap;
  return Math.max(0, wait) + index * gap;
}

// Avoids a one-frame flash of the full text before typing starts (SSR-safe).
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function TypewriterEntry({
  id,
  index,
  completed,
  sequence,
  options,
  className,
  children,
}: AnimationEntryProps) {
  const root = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  const active =
    useSyncExternalStore(sequence.subscribe, sequence.snapshot, () => 0) >=
    index;

  const ready = !options.sequence || active;

  // Depend on primitives, not the `options` object. An inline object has a new
  // identity every render, which would restart the animation each time.
  const {
    sequence: isSequence,
    duration: durationOpt,
    wait,
    stagger,
  } = options;

  useEffect(() => {
    if (ready && (reducedMotion || (id !== undefined && completed.has(id)))) {
      sequence.complete(index);
    }
  }, [ready, reducedMotion, id, index, completed, sequence]);

  useIsomorphicLayoutEffect(() => {
    const done = () => {
      if (id !== undefined) completed.add(id);
      sequence.complete(index);
    };
    const element = root.current;
    if (
      !element ||
      !ready ||
      reducedMotion ||
      (id !== undefined && completed.has(id))
    ) {
      return;
    }

    const document = element.ownerDocument;
    if (typeof Highlight === "undefined" || !globalThis.CSS?.highlights) {
      done();
      return;
    }
    const highlightName = "mf-typewriter-hidden";
    const registry = CSS.highlights;
    const hidden = registry.get(highlightName) ?? new Highlight();
    registry.set(highlightName, hidden);

    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const segmenter = new Intl.Segmenter();
    const entries: { range: Range; offsets: number[]; length: number }[] = [];
    let node: Node | null;
    while ((node = walker.nextNode())) {
      const text = node as Text;
      if (!text.length) continue;
      const range = document.createRange();
      range.selectNodeContents(text);
      const offsets = Array.from(
        segmenter.segment(text.data),
        ({ index }) => index,
      );
      entries.push({ range, offsets, length: text.length });
      hidden.add(range);
    }
    const total = entries.reduce((sum, entry) => sum + entry.offsets.length, 0);
    if (!total) {
      done();
      return;
    }

    const clearRanges = () => {
      for (const { range } of entries) hidden.delete(range);
    };
    const duration = Math.max(0, durationOpt ?? 0.3) * 1000;
    const delay = getAnimationDelay(index, isSequence, wait, stagger) * 1000;
    let frame: number;
    let started: number | undefined;

    const reveal = (now: number) => {
      started ??= now;
      let remaining = duration
        ? Math.floor(((now - started) / duration) * total)
        : total;
      if (remaining >= total) {
        clearRanges();
        done();
        return;
      }
      for (const { range, offsets, length } of entries) {
        range.setStart(
          range.startContainer,
          offsets[Math.max(0, remaining)] ?? length,
        );
        remaining -= offsets.length;
      }
      frame = requestAnimationFrame(reveal);
    };

    const start = setTimeout(() => {
      frame = requestAnimationFrame(reveal);
    }, delay);
    return () => {
      clearTimeout(start);
      cancelAnimationFrame(frame);
      clearRanges();
    };
  }, [
    children,
    id,
    index,
    completed,
    reducedMotion,
    ready,
    sequence,
    isSequence,
    durationOpt,
    wait,
    stagger,
  ]);

  return createElement("div", {
    ref: root,
    className: clsx(className) || undefined,
    style: {
      visibility: isSequence && !ready && !reducedMotion ? "hidden" : undefined,
    },
    children,
  });
}

interface AnimationEntryProps {
  className?: ClassValue;
  id?: string;
  index: number;
  completed: Set<string>;
  sequence: AnimationSequence;
  options: AnimationOptions;
  children: ReactNode;
}

export function AnimatedEntry(props: AnimationEntryProps) {
  return props.options.effect === "typewriter"
    ? createElement(TypewriterEntry, props)
    : createElement(MotionEntry, props);
}

function MotionEntry({
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
      ease: "easeOut",
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

type AnimationProps = Pick<
  AnimationOptions,
  "effect" | "duration" | "distance" | "wait"
> & {
  children: ReactNode;
  className?: ClassValue;
};

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

function ExpandingEntry({
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
      className={["mf-animation-expanding-entry", active >= index || !!reducedMotion ? "is-expanded" : ""].filter(Boolean).join(" ")}
    >
      <div>{children}</div>
    </div>
  );
}

interface AnimationGroupProps {
  className?: ClassValue;
  /** Expand each sequential entry as it starts. */
  expand?: boolean;
  sequence?: boolean;
  stagger?: number;
  wait?: number;
  children: ReactNode;
}

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
