import { generator } from './generator.js';

/**
 * Multicast — fans an async iterator out to multiple subscribers.
 *
 * Each subscriber gets its own push-driven async iterator (via generator()).
 * When the input iterator yields, every subscriber's consumer is invoked
 * with the value. When the input completes, all subscribers' iterators
 * are returned.
 *
 * Subscribers may pass an optional transform that's applied to each value
 * before it lands in their iterator.
 *
 * Multicast operates only on plain async iterators. The caller is
 * responsible for unwrapping any higher-level wrappers (e.g. maya's
 * Channel) before passing the iterator in.
 */
export class Multicast {
    #consumers = [];
    #iterators = [];
    #iter = null;

    constructor(iter) {
        this.#iter = iter;
        this.start();
    }

    async start() {
        const iter = this.#iter;
        for await(const value of iter) {
            for(const consumer of this.#consumers) {
                consumer(value);
            }
        }

        // input is complete — close all subscribers
        for(const iter of this.#iterators) {
            let done = false;
            while(!done) (done = await iter.return());
        }
    }

    subscriber(transform) {
        const [iterator, next] = generator(transform);
        this.#iterators.push(iterator);
        this.#consumers.push(next);
        return iterator;
    }
}
