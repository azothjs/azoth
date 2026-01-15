import { SyncAsync } from '@azothjs/maya/compose';
import { generator } from './generator.js';

export class Multicast {
    #consumers = [];
    #iterators = [];
    #iter = null;

    constructor(iter) {
        // TODO: track sync value and add to subscribers
        this.#iter = (iter instanceof SyncAsync) ? iter.async : iter;
        this.start();
    }

    async start() {
        const iter = this.#iter;
        for await(const value of iter) {
            for(const consumer of this.#consumers) {
                consumer(value);
            }
        }

        // generator is complete
        for(const iter of this.#iterators) {
            let done = false;
            while(!done) (done = await iter.return());
        }
    }

    subscriber(transform, options) {
        const [iterator, next] = generator(transform, options);
        this.#iterators.push(iterator);
        this.#consumers.push(next);
        return iterator;
    }
}
