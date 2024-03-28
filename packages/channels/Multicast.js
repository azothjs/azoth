import { SyncAsync } from '@azothjs/maya/compose';
import { generator } from './generator.js';

export class Multicast {
    #consumers = [];
    #iter = null;

    constructor(iter) {
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
    }

    subscriber(transform, options) {
        const [iterator, next] = generator(transform, options);
        this.#consumers.push(next);
        return iterator;
    }
}
