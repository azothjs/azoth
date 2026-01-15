import { SyncAsync } from '@azothjs/maya/compose';
import { resolveArgs } from '../resolve-args.js';


export function generator(transformArg, options) {
    const {
        transform,
        init, start, map,
        hasStart, hasInit
    } = resolveArgs(transformArg, options);

    const maybeMap = payload => payload?.map ? payload.map(transform) : payload;
    const maybeTransform = transform
        ? map
            ? payload => payload?.then ? payload.then(maybeMap) : maybeMap(payload)
            : payload => payload?.then ? payload.then(transform) : transform(payload)
        : payload => payload;

    let onDeck = hasStart && hasInit ? maybeTransform(init) : undefined;
    const relay = { resolve: null };

    function dispatch(payload) {
        payload = maybeTransform(payload);

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

    if(hasStart) {
        return [SyncAsync.from(start, asyncIterator), dispatch];
    }

    if(hasInit) {
        const value = maybeTransform(init);
        return [SyncAsync.from(value, asyncIterator), dispatch];
    }

    return [asyncIterator, dispatch];
}
