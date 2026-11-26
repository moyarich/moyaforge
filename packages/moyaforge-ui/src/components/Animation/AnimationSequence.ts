/** Tracks the first unfinished entry in a zero-based animation sequence. */
export class AnimationSequence {
  private next = 0;
  private finished = new Set<number>();
  private listeners = new Set<() => void>();

  /** Subscribe to progress changes; returns an unsubscribe function. */
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  /** Return the index of the first unfinished entry for useSyncExternalStore. */
  snapshot = () => this.next;

  /**
   * Mark an entry complete and advance through contiguous finished entries.
   * Duplicate or previously completed indices do not notify subscribers.
   * @param index Zero-based entry position.
   */
  complete(index: number) {
    if (index < this.next || this.finished.has(index)) return;
    this.finished.add(index);
    const previous = this.next;
    while (this.finished.delete(this.next)) this.next++;
    if (previous !== this.next) {
      for (const listener of this.listeners) listener();
    }
  }
}
