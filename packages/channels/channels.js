import { Multicast } from './generators.js';

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
            throwAsyncSourceTypeError(type);
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
    if(startWith) {
        return fromPromiseStartWith(promise, channel, startWith);
    }
    return channel ? promise.then(channel) : promise;
}

async function* fromPromiseStartWith(promise, channel, startWith) {
    yield startWith;
    yield channel ? promise.then(channel) : promise;
}

async function* fromAsyncIterator(iterator, channel, options) {
    const startWith = options?.startWith;
    if(startWith) yield startWith;
    for await(const value of iterator) {
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

function branchAsyncIterator(iterator, channels, options) {
    const multicast = new Multicast(iterator);
    return channels.map(channel => {
        if(Array.isArray(channel)) { // [channel, options]
            return multicast.subscriber(channel[0], channel[1]);
        }
        return multicast.subscriber(channel, options);
    });
}

function throwAsyncSourceTypeError(type) {
    throw new TypeError(`\
Unexpected asynchronous data source type "${type}". Expected an async data provider type, or \
a function that returns an async data provider type."`);
}
