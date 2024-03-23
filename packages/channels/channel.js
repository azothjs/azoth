import { Sync } from '../maya/compose/compose.js';
import { resolveArgs } from './resolve-args.js';
import { AsyncTypeError, InitOptionWithSyncWrappedAsyncProviderError, OptionMissingFunctionArgumentError } from './throw.js';

export function channel(async, transformArg, options) {
    const {
        transform,
        init, start, map,
        hasStart, hasInit
    } = resolveArgs(transformArg, options);
    let sync = init;

    if(async instanceof Sync) {
        const { initial, input } = async;
        if(hasInit) {
            throw new InitOptionWithSyncWrappedAsyncProviderError();
        }
        sync = initial;
        async = input;
    }

    let hasSync = sync !== undefined;
    if(hasSync && transform) sync = transform(sync);

    let onDeck;
    if(hasStart && hasSync) {
        onDeck = sync;
        sync = undefined;
        hasSync = false;
    }

    const out = makeChannel(async, transform, map, onDeck);

    if(hasStart) return Sync.wrap(start, out);
    if(hasSync) return Sync.wrap(sync, out);
    return out;
}

function makeChannel(asyncSource, transform, map, onDeck) {
    switch(true) {
        case asyncSource instanceof Promise: {
            const promised = fromPromise(asyncSource, transform, map);
            return onDeck ? toAsyncGenerator(onDeck, promised) : promised;
        }
        case !!asyncSource[Symbol.asyncIterator]:
            return fromAsyncIterator(asyncSource, transform, map, onDeck);
        default:
            throw new AsyncTypeError(asyncSource);
    }
}

function fromPromise(promise, transform, map) {
    if(map) {
        // TODO: additional errors if not array?
        return promise.then(array => array.map(transform));
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
            yield value.map(transform);
            continue;
        }
        yield transform ? transform(value) : value;
    }
}
