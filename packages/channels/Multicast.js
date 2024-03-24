import { Sync } from '../maya/compose/compose.js';
import { generator } from './generator.js';
import { observe } from './unicast.js';

export class Multicast {
    #consumers = [];
    #async = null;
    #started = false;
    #initial;

    constructor(async) {
        if(async instanceof Sync) {
            const { initial, input } = async;
            this.#async = input;
            this.#initial = initial;
        }
        else {
            this.#async = async;
        }
        this.start();
    }

    async start() {
        const async = this.#async;
        this.#started = true;
        for await(let value of async) {
            for(let consumer of this.#consumers) {
                consumer(value);
            }
        }
    }

    channel(transform, options) {

    }

    subscriber(transform, options) {
        const [iterator, next] = generator(transform, options);
        this.#consumers.push(next);
        return iterator;
    }
}
