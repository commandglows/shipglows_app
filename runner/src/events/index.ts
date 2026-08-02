import type { PersistedEvent } from "../db/index.js";

export interface EventSubscription {
  readonly events: AsyncIterable<PersistedEvent>;
  readonly close: () => void;
}

class EventQueue implements AsyncIterable<PersistedEvent> {
  #values: PersistedEvent[] = [];
  #waiters: ((result: IteratorResult<PersistedEvent>) => void)[] = [];
  #closed = false;

  push(event: PersistedEvent): void {
    const waiter = this.#waiters.shift();
    if (waiter !== undefined) {
      waiter({ done: false, value: event });
      return;
    }
    this.#values.push(event);
  }

  close(): void {
    if (this.#closed) return;
    this.#closed = true;
    for (const waiter of this.#waiters.splice(0)) waiter({ done: true, value: undefined });
  }

  async *[Symbol.asyncIterator](): AsyncIterator<PersistedEvent> {
    while (this.#values.length > 0 || !this.#closed) {
      const value = this.#values.shift();
      if (value !== undefined) {
        yield value;
        continue;
      }
      const result = await new Promise<IteratorResult<PersistedEvent>>((resolve) => {
        this.#waiters.push(resolve);
      });
      if (result.done) return;
      yield result.value;
    }
  }
}

export class EventHub {
  readonly #listeners = new Map<string, Set<EventQueue>>();

  #key(input: { readonly tenantId: string; readonly conversationId: string }): string {
    return `${input.tenantId}:${input.conversationId}`;
  }

  publish(event: PersistedEvent): void {
    for (const queue of this.#listeners.get(this.#key(event)) ?? []) queue.push(event);
  }

  subscribe(input: { readonly tenantId: string; readonly conversationId: string }): EventSubscription {
    const queue = new EventQueue();
    const key = this.#key(input);
    const listeners = this.#listeners.get(key) ?? new Set<EventQueue>();
    listeners.add(queue);
    this.#listeners.set(key, listeners);
    let closed = false;
    return {
      events: queue,
      close: () => {
        if (closed) return;
        closed = true;
        queue.close();
        const current = this.#listeners.get(key);
        current?.delete(queue);
        if (current?.size === 0) this.#listeners.delete(key);
      },
    };
  }
}
