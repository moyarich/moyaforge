/** Tracks the first unfinished entry in a zero-based animation sequence. */
export class AnimationSequence {
  private next = 0;
  private finished = new Set<number>();
  private listeners = new Set<() => void>();

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  snapshot = () => this.next;

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
