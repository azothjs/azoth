// import { subject } from './generators.js';
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

function processArguments(transforms) {
    let options = null;
    if(transforms.length) {
        const maybeOptions = transforms.at(-1);
        if(typeof maybeOptions === 'object') {
            options = maybeOptions;
            transforms.length--;
        }
    }
    return [transforms, options];
}

export function from(asyncSource, ...args) {
    const [transforms, options] = processArguments(args);
    const type = typeof asyncSource;

    switch(true) {
        case asyncSource instanceof Promise:
            return transforms.length < 2
                ? fromPromise(asyncSource, transforms[0], options)
                : branchPromise(asyncSource, transforms, options);
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

function branchPromise(promise, transforms) {
    return transforms.map(transform => {
        if(Array.isArray(transform)) {
            return fromPromiseStartWith(promise, transform[0], transform[1]);
        }
        return promise.then(transform);
    });
}

async function* fromPromiseStartWith(promise, transform, startWith) {
    yield startWith;
    yield transform ? promise.then(transform) : promise;
}
