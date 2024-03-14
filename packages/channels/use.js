import { Multicast } from './generators.js';
import { AsyncSourceTypeError, OptionMissingFunctionArgumentError } from './throw.js';

export function use(asyncSource, ...args) {
    const [channels, options] = getArguments(args);
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

function fromPromise(promise, channel, options) {
    const startWith = options?.startWith;
    const map = options?.map ?? false;
    if(startWith) {
        return fromPromiseStartWith(startWith, promise, channel, map);
    }
    return promiseResolution(promise, channel, map);
}

async function* fromPromiseStartWith(startWith, promise, channel, map) {
    yield startWith;
    yield promiseResolution(promise, channel, map);
}

function promiseResolution(promise, channel, map) {
    if(map) {
        if(!channel) throw new OptionMissingFunctionArgumentError();
        // TODO: include or suppress index? which param???
        // collapse "slottable" back into props???
        return promise.then(array => array.map(channel));
    }
    return channel ? promise.then(channel) : promise;
}

async function* fromAsyncIterator(iterator, channel, options) {
    const startWith = options?.startWith;
    const map = options?.map ?? false;
    if(map && !channel) throw new OptionMissingFunctionArgumentError();

    if(startWith) yield startWith;

    for await(const value of iterator) {
        if(map) {
            yield value.map(channel);
            continue;
        }

        yield channel ? channel(value) : value;
    }
}

function branchPromise(promise, channels) {
    return channels.map(channel => {
        if(Array.isArray(channel)) { // [channel, options]
            return fromPromise(promise, channel[0], channel[1]);
        }
        return promise.then(channel);
    });
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
