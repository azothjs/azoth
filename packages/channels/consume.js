import { SyncAsync } from '@azothjs/maya/compose';
import { resolveArgs } from './resolve-args.js';
import { AsyncTypeError, InitOptionWithSyncWrappedAsyncProviderError } from './throw.js';

export function consume(async, transform, options) {
    const {
        map, transform: consumer, // specialized version of transform
        init, hasStart, hasInit
    } = resolveArgs(transform, options);

    if(hasStart) {
        // TODO: move to throw.js
        throw new TypeError(`Option "start" cannot be used with consume as it does not emit values`);
    }

    let sync = init;
    if(async instanceof SyncAsync) {
        if(hasInit) throw new InitOptionWithSyncWrappedAsyncProviderError();
        sync = async.sync;
        async = async.async;
    }

    if(sync !== undefined) consumer(sync);

    if(!map) doConsume(async, consumer);
    else mapConsume(async, consumer, map);
}

async function doConsume(async, transform) {
    if(async instanceof Promise) {
        async.then(transform);
    }
    else if(async?.[Symbol.asyncIterator]) {
        for await(const value of async) {
            transform(value);
        }
    }
    else {
        throw new AsyncTypeError(async);
    }
}

async function mapConsume(async, transform, map) {
    if(async instanceof Promise) {
        async.then(array => array?.map(transform));
    }
    else if(async?.[Symbol.asyncIterator]) {
        for await(const value of async) {
            value?.map(transform);
        }
    }
    else {
        throw new AsyncTypeError(async);
    }
}
