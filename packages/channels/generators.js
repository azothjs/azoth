import { Sync } from '../maya/compose/compose.js';
import { resolveArgs } from './resolve-args.js';

export function subject(transformArg, options) {
    const {
        transform,
        init, start, map,
        hasStart, hasInit
    } = resolveArgs(transformArg, options);

    const maybeTransform = payload => transform ? transform(payload) : payload;

    const relay = { resolve: null };
    let onDeck = hasStart && hasInit ? maybeTransform(init) : undefined;

    function dispatch(payload) {
        if(map) payload = payload?.map(transform);
        else payload = maybeTransform(payload);

        if(relay.resolve) relay.resolve(payload);
        else onDeck = payload;
    }

    async function* generator() {
        let promise = null;
        let resolve = null;

        // this handles:
        // 1. maybeTransformed init when init is used with start
        // 2. dispatch fires via synchronous call during render
        while(onDeck !== undefined) {
            const received = onDeck;
            onDeck = undefined;
            yield received;
        }

        while(true) {
            ({ promise, resolve } = Promise.withResolvers());
            relay.resolve = resolve;
            yield await promise;
        }
    }

    let asyncIterator = generator();

    // eslint-disable-next-line eqeqeq
    if(hasStart) {
        return [Sync.wrap(start, asyncIterator), dispatch];
    }
    // eslint-disable-next-line eqeqeq
    if(hasInit) {
        const value = transform ? transform(init) : init;
        return [Sync.wrap(value, asyncIterator), dispatch];
    }

    return [asyncIterator, dispatch];
}


export function multicast(iterator) {
    return new Multicast(iterator);
}

export class Multicast {
    #consumers = [];
    #async = null;
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

        this.#start();
    }

    async #start() {
        const async = this.#async;
        for await(let value of async) {
            for(let consumer of this.#consumers) {
                consumer(value);
            }
        }
    }

    subscriber(transform, options) {
        const [iterator, next] = subject(transform, options);
        this.#consumers.push(next);
        return iterator;
    }
}
