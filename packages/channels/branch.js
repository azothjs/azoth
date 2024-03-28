import { Multicast } from './Multicast.js';
import { AsyncTypeError } from './throw.js';
import { channel } from './channel.js';
import { SyncAsync } from '@azothjs/maya/compose';

export function branch(async, ...transforms) {

    if(async instanceof SyncAsync) {
        const sync = async.sync;
        async = async.async;

        transforms = transforms.map(transform => {
            let options = null;
            if(Array.isArray(transform)) {
                options = transform[1];
                transform = transform[0];
            }
            options ? options.init = sync : (options = { init: sync });
            return [transform, options];
        });
    }

    return makeBranches(async, transforms);
}

export function makeBranches(async, transforms) {
    switch(true) {
        case async instanceof Promise:
            return branchPromise(async, transforms);
        case !!async?.[Symbol.asyncIterator]:
            return branchAsyncIterator(async, transforms);
        default:
            throw new AsyncTypeError(async);
    }
}

function branchPromise(promise, transforms) {
    return transforms.map(transform => {
        if(Array.isArray(transform)) { // #[transform, options]
            return channel(promise, transform[0], transform[1]);
        }
        return channel(promise, transform);
    });
}

function branchAsyncIterator(iterator, transforms) {
    const multicast = new Multicast(iterator);
    const branches = transforms.map(transform => {
        if(Array.isArray(transform)) { // #[transform, options];
            return multicast.subscriber(transform[0], transform[1]);
        }
        return multicast.subscriber(transform);
    });
    multicast.start();
    return branches;
}
