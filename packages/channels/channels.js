import { subject } from './generators.js';
import 'test-utils/with-resolvers-polyfill';

function throwMoreArgumentsNeeded() {
    throw new TypeError(`\
"Channel.from(promise)" requires more arguments, \
expected a transform option or channel options. \
Use "promise.then(transform)" for creating a channel from a single promise`);
}

function throwAsyncSourceTypeError(type) {
    throw new TypeError(`\
Unexpected async source type "${type}". Expected an asynchronous data provider type, or \
a function that returns an asynchronous data provider type."`);
}

export class Channel {
    static from = from;
}

export function from(asyncSource, transform, options) {
    if(!options && typeof transform === 'object') {
        options = transform;
        transform = null;
    }

    const type = typeof asyncSource;

    switch(true) {
        case asyncSource instanceof Promise:
            return fromPromise(asyncSource, transform, options);
        default:
            throwAsyncSourceTypeError(type);

    }
}

function fromPromise(promise, transform, options) {
    const startWith = options?.startWith;
    if(startWith) {
        return [fromPromiseStartWith(promise, transform, startWith)];
    }
    return [transform ? promise.then(transform) : promise];
}

async function* fromPromiseStartWith(promise, transform, startWith) {
    yield startWith;
    yield transform ? promise.then(transform) : promise;
}