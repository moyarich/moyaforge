"use client";

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

    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const entries: Array<{ node: Text; value: string }> = [];
    let node: Node | null;
    while ((node = walker.nextNode())) {
      const text = node as Text;
      if (text.textContent)
        entries.push({ node: text, value: text.textContent });
    }
    const segmenter = new Intl.Segmenter();
    const segments = entries.map(({ value }) =>
      Array.from(segmenter.segment(value), ({ segment }) => segment),
    );
    const total = segments.reduce((sum, segment) => sum + segment.length, 0);
    if (!total) {
      done();
      return;
    }

    for (const entry of entries) entry.node.textContent = "";

    let position = 0;
    const duration = Math.max(0, durationOpt ?? 0.3) * 1000;
    const stepTime = duration / total;
    const startDelay =
      getAnimationDelay(index, isSequence, wait, stagger) * 1000;

    let ticker: ReturnType<typeof setInterval> | undefined;
    const reveal = () => {
      position += 1;
      let remaining = position;
      entries.forEach((entry, i) => {
        const chars = segments[i]!;
        const amount = Math.min(chars.length, Math.max(0, remaining));
        entry.node.textContent = chars.slice(0, amount).join("");
        remaining -= amount;
      });
      if (position >= total) {
        if (ticker !== undefined) clearInterval(ticker);
        done();
      }
    };
    const start = setTimeout(() => {
      if (stepTime <= 0) {
        for (const entry of entries) entry.node.textContent = entry.value;
        done();
      } else {
        ticker = setInterval(reveal, Math.max(1, stepTime));
      }
    }, startDelay);

    return () => {
      clearTimeout(start);
      if (ticker !== undefined) clearInterval(ticker);
      for (const entry of entries) entry.node.textContent = entry.value;
    };
  }, [
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
    style: {
      visibility: isSequence && !ready && !reducedMotion ? "hidden" : undefined,
    },
    children,
  });
}

interface AnimationEntryProps {
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
    initial: reducedMotion || alreadyCompleted || !ready ? false : initial,
    animate: visible ? animate : initial,
    transition: {
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
    children,
  });
}

type AnimationProps = Pick<
  AnimationOptions,
  "effect" | "duration" | "distance" | "wait"
> & {
  children: ReactNode;
};

export function Animation({ children, ...options }: AnimationProps) {
  const [sequence] = useState(() => new AnimationSequence());
  const [completed] = useState(() => new Set<string>());
  return createElement(AnimatedEntry, {
    index: 0,
    sequence,
    completed,
    options,
    children,
  });
}

interface AnimationGroupProps {
  sequence?: boolean;
  stagger?: number;
  wait?: number;
  children: ReactNode;
}

export function AnimationGroup({
  sequence: sequential = false,
  stagger = 0,
  wait = 0,
  children,
}: AnimationGroupProps) {
  const [sequence] = useState(() => new AnimationSequence());
  const [completed] = useState(() => new Set<string>());
  let index = 0;
  return Children.map(children, (child) => {
    if (!isValidElement<AnimationProps>(child) || child.type !== Animation)
      return child;
    const { children: content, ...options } = child.props;
    return createElement(AnimatedEntry, {
      index: index++,
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
  });
}
