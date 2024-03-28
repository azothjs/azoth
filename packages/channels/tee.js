import { SyncAsync } from '@azothjs/maya/compose';
import { Multicast } from './Multicast.js';
import { AsyncTypeError, BadTeeCountArgumentError } from './throw.js';

export function tee(async, count = 2) {
    const num = parseInt(count);
    if(!(num >= 2)) {
        throw new BadTeeCountArgumentError(count);
    }

    let sync;
    if(async instanceof SyncAsync) {
        sync = async.sync;
        async = async.async;
    }

    return makeTee(async, num, sync);
}

function makeTee(async, count, init) {
    const type = typeof async;
    switch(true) {
        case async instanceof Promise:
            return teePromise(async, count, init);
        case !!async?.[Symbol.asyncIterator]:
            return teeAsyncIterator(async, count, init);
        default:
            throw new AsyncTypeError(async);
    }
}

function teePromise(promise, count, init) {
    const tees = [];
    for(let i = 0; i < count; i++) {
        tees.push(init !== undefined ? SyncAsync.from(init, promise) : promise);
    }
    return tees;
}

function teeAsyncIterator(iterator, count, init) {
    const multicast = new Multicast(iterator);
    const tees = [];
    for(let i = 0; i < count; i++) {
        const subscriber = multicast.subscriber();
        tees.push(init ? SyncAsync.from(init, subscriber) : subscriber);
    }
    multicast.start();
    return tees;
}
