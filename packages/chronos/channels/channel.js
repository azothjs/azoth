import { SyncAsync } from '@azothjs/maya/compose';
import { resolveArgs } from '../resolve-args.js';
import { AsyncTypeError, InitOptionWithSyncWrappedAsyncProviderError } from '../throw.js';

export function channel(async, transformArg, options) {
    const {
        transform,
        init, start, map,
        hasStart, hasInit
    } = resolveArgs(transformArg, options);
    let sync = init;

    if(async instanceof SyncAsync) {
        if(hasInit) {
            throw new InitOptionWithSyncWrappedAsyncProviderError();
        }
        sync = async.sync;
        async = async.async;
    }

    let hasSync = sync !== undefined;
    // if(hasSync && transform) sync = transform(sync);
    if(hasSync && transform) sync = map ? sync?.map(transform) : transform(sync);

    let onDeck;
    if(hasStart && hasSync) {
        onDeck = sync;
        sync = undefined;
        hasSync = false;
    }

    const out = makeChannel(async, transform, map, onDeck);

    if(hasStart) return SyncAsync.from(start, out);
    if(hasSync) return SyncAsync.from(sync, out);
    return out;
}

function makeChannel(async, transform, map, onDeck) {
    switch(true) {
        case async instanceof Promise: {
            const promised = fromPromise(async, transform, map);
            return onDeck ? toAsyncGenerator(onDeck, promised) : promised;
        }
        case !!async?.[Symbol.asyncIterator]:
            return fromAsyncIterator(async, transform, map, onDeck);
        default:
            throw new AsyncTypeError(async);
    }
}

function fromPromise(promise, transform, map) {
    if(map) {
        return promise.then(array => array?.map(transform));
    }
    return transform ? promise.then(transform) : promise;

}

async function* toAsyncGenerator(onDeck, promise) {
    yield onDeck;
    yield promise;
}

async function* fromAsyncIterator(iterator, transform, map, onDeck) {
    if(onDeck) yield onDeck;

    for await(const value of iterator) {
        if(map) {
            yield value?.map(transform);
            continue;
        }
        yield transform ? transform(value) : value;
    }
}
