"use client";

import "./Animation.css";
import { clsx } from "clsx";
import { useReducedMotion } from "motion/react";
import {
  createElement,
  useEffect,
  useLayoutEffect,
  useRef,
  useSyncExternalStore,
} from "react";
import type { AnimationEntryProps } from "./Animation.types.js";
import { getAnimationDelay } from "./getAnimationDelay.js";

// Avoids a one-frame flash of the full text before typing starts (SSR-safe).
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Low-level text reveal entry connected to an AnimationSequence.
 * Preserves the final text's layout while progressively revealing characters.
 * Prefer Animation with effect="typewriter" for ordinary component usage.
 */
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
