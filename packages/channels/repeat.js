import { Multicast } from './generators.js';
import { AsyncSourceTypeError } from './throw.js';

export function repeat(asyncSource, count = 2) {
    // TODO: validate positive integer
    const type = typeof asyncSource;
    switch(true) {
        case asyncSource instanceof Promise:
            return repeatPromise(asyncSource, count);
        case !!asyncSource[Symbol.asyncIterator]:
            return repeatAsyncIterator(asyncSource, count);
        default:
            throw new AsyncSourceTypeError(type);
    }
}

function repeatPromise(promise, count) {
    switch(count) {
        case 1:
            return [promise];
        case 2:
            return [promise, promise];
        case 3:
            return [promise, promise, promise];
        default: {
            const repeats = [];
            for(let i = 0; i < count; i++) {
                repeats.push(promise);
            }
            return repeats;
        }
    }
}

function repeatAsyncIterator(iterator, count) {
    const multicast = new Multicast(iterator);
    const repeats = [];
    for(let i = 0; i < count; i++) {
        repeats.push(multicast.subscriber());
    }
    return repeats;
}
