import { Sync } from '../maya/compose/compose.js';
import { Multicast } from './generators.js';
import { AsyncSourceTypeError, OptionMissingFunctionArgumentError } from './throw.js';

export function channel(async, transform, options) {
    if(!options && typeof transform === 'object') {
        options = transform;
        transform = null;
    }

    let sync = options?.init;

    if(async instanceof Sync) {
        const { initial, input } = async;
        // TODO: conflict if already set via options.init?
        sync = initial;
        async = input;
    }

    const out = makeChannel(async, transform, options);

    const start = options?.start;
    if(start !== undefined) {
        return Sync.wrap(start, out);
    }

    if(sync !== undefined) {
        return Sync.wrap(transform ? transform(sync) : sync, out);
    }

    return out;
}

function makeChannel(asyncSource, transform, options) {
    switch(true) {
        case asyncSource instanceof Promise:
            return fromPromise(asyncSource, transform, options);
        case !!asyncSource[Symbol.asyncIterator]:
            return fromAsyncIterator(asyncSource, transform, options);
        default:
            throw new AsyncSourceTypeError(typeof asyncSource);
    }
}

export function branch(asyncSource, ...transforms) {
    switch(true) {
        case asyncSource instanceof Promise:
            return branchPromise(asyncSource, transforms);
        case !!asyncSource[Symbol.asyncIterator]:
        default:
            throw new AsyncSourceTypeError(typeof asyncSource);
    }
}

function branchPromise(promise, transforms) {
    return transforms.map(transform => {
        let options = undefined;
        if(Array.isArray(transform)) { // #[channel, options]
            options = transform[1];
            transform = transform[0];
        }

        return channel(promise, transform, options);
    });
}

function fromPromise(promise, channel, options) {
    const startWith = options?.startWith;
    const map = options?.map ?? false;
    if(startWith) {
        return fromPromiseStartWith(startWith, promise, channel, map);
    }
    return promiseResolution(promise, channel, map);
}

function doUse(asyncSource, channels, options) {
    const start = options?.start;
    const type = typeof asyncSource;

    switch(true) {
        case asyncSource instanceof Promise:
            return channels.length < 2
                ? [fromPromise(asyncSource, channels[0], options)]
                : branchPromise(asyncSource, channels, options);
        case !!asyncSource[Symbol.asyncIterator]:
            return channels.length < 2
                ? [fromAsyncIterator(asyncSource, channels[0], options)]
                : branchAsyncIterator(asyncSource, channels, options);
        case asyncSource instanceof Sync: {
            const { initial, input } = asyncSource;
            const output = doUse(input, channels, options);
            return [Sync.wrap(channels[0] ? channels[0](initial) : initial, output[0])];
        }
        default:
            throw new AsyncSourceTypeError(type);
    }
}

function getArguments(channels) {
    let options = null;
    if(channels.length) {
        const maybeOptions = channels.at(-1);
        if(typeof maybeOptions === 'object') {
            options = maybeOptions;
            channels.length--;
        }
    }
    return [channels, options];
}

async function* fromPromiseStartWith(startWith, promise, channel, map) {
    yield startWith;
    yield promiseResolution(promise, channel, map);
}

function promiseResolution(promise, channel, map) {
    if(map) {
        if(!channel) throw new OptionMissingFunctionArgumentError();
        return promise.then(array => array.map(channel));
    }
    return channel ? promise.then(channel) : promise;
}

async function* fromAsyncIterator(iterator, channel, options) {
    // const start = options?.start;
    const map = options?.map ?? false;
    if(map && !channel) throw new OptionMissingFunctionArgumentError();

    // if(start) yield start;

    for await(const value of iterator) {
        if(map) {
            yield value.map(channel);
            continue;
        }
        yield channel ? channel(value) : value;
    }
}

function branchAsyncIterator(iterator, channels) {
    const multicast = new Multicast(iterator);
    return channels.map(channel => {
        if(Array.isArray(channel)) { // [channel, options]
            return multicast.subscriber(channel[0], channel[1]);
        }
        return multicast.subscriber(channel);
    });
}
