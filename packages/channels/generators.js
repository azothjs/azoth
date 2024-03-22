import { Sync } from '../maya/compose/compose.js';
import { OptionMissingFunctionArgumentError } from './throw.js';

function resolveOptions(options, transform) {
    let start, init, map = false;
    if(options) {
        init = options.init;
        start = options.start;
        map = !!options.map;
        if(map && !transform) {
            throw new OptionMissingFunctionArgumentError();
        }
    }
    return {
        init, start, map,
        hasStart: start !== undefined,
        hasInit: init !== undefined,
    };
}

export function subject(transform, options) {
    if(!options && typeof transform === 'object') {
        options = transform;
        transform = null;
    }

    const { init, start, map, hasStart, hasInit } = resolveOptions(options, transform);

    const relay = { resolve: null };

    const maybeTransform = payload => transform ? transform(payload) : payload;

    let onDeck = hasStart && hasInit ? maybeTransform(init) : null;

    function dispatch(payload) {
        if(map) payload = payload.map(transform);
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

    constructor(subject) {
        this.subject = subject;
        this.#start();
    }

    async #start() {
        for await(let value of this.subject) {
            for(let consumer of this.#consumers) {
                consumer(value);
            }
        }
    }

    subscriber(transform, options) {
        const [iterator, dispatch] = subject(transform, options);
        this.#consumers.push(dispatch);
        return iterator;
    }
}
