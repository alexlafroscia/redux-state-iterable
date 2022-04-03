import { deferred } from "https://deno.land/std@0.132.0/async/mod.ts";

interface Store<State> {
  getState(): State;

  subscribe(listener: () => void): () => void;
}

export class StateIterable<State> {
  /**
   * State values that have not yet been yielded
   *
   * Note: using `Array` over `Set` to preserve order
   */
  private yields: State[] = [];

  private signal = deferred<void>();

  private unsubscribeCallback: () => void;

  private isSubscribed = true;

  constructor(protected store: Store<State>) {
    this.unsubscribeCallback = this.store.subscribe(() => {
      this.yields.push(this.store.getState());

      this.signal.resolve();
    });
  }

  /**
   * Clean up the `Store` subscription
   *
   * This also causes the iterable to complete
   */
  unsubscribe() {
    this.unsubscribeCallback();
    this.isSubscribed = false;
  }

  async *iterate(): AsyncIterableIterator<State> {
    // Immediately yield the initial state of the store
    yield this.store.getState();

    while (this.isSubscribed) {
      // Wait for the store to signal that we have new state to yield
      await this.signal;

      // Multiple state values may have been produced since we last retrieved them;
      // yield them all. New values can be added to the array while we're consuming
      // them since they can be both consumed and produced asynchronously
      for (let i = 0; i < this.yields.length; i++) {
        const state = this.yields[i];

        yield state;
      }

      // Reset for the next batch
      this.yields.length = 0;
      this.signal = deferred();
    }
  }

  [Symbol.asyncIterator](): AsyncIterator<State> {
    return this.iterate();
  }
}
