import { Sync } from '../maya/compose/compose.js';
import { Multicast } from './generators.js';
import { resolveArgs } from './resolve-args.js';
import { AsyncSourceTypeError } from './throw.js';
import { channel } from './channel.js';

export function branch(asyncSource, ...transforms) {
    // TODO: no transforms error, or numeric repeat?
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
        if(Array.isArray(transform)) {
            // #[transform, options]
            return channel(promise, transform[0], transform[1]);
        }
        return channel(promise, transform);
    });
}

function branchAsyncIterator(iterator, transforms) {
    const multicast = new Multicast(iterator);
    return transforms.map(transform => {
        if(Array.isArray(transform)) {
            // #[transform, options];
            multicast.subscriber(transform[0], transform[1]);
        }
        return multicast.subscriber(transform);
    });
}
