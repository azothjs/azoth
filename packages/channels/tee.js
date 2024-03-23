import { Sync } from '../maya/compose/compose.js';
import { Multicast } from './generators.js';
import { AsyncSourceTypeError, BadTeeCountArgumentError } from './throw.js';

export function tee(async, count = 2) {
    const repeat = parseInt(count);
    if(!(count >= 2)) {
        throw new BadTeeCountArgumentError(count);
    }

    let init;
    if(async instanceof Sync) {
        const { initial, input } = async;
        init = initial;
        async = input;
    }

    return makeTee(async, count, init);
}

function makeTee(asyncProvider, count, init) {
    const type = typeof asyncProvider;
    switch(true) {
        case asyncProvider instanceof Promise:
            return teePromise(asyncProvider, count, init);
        case !!asyncProvider?.[Symbol.asyncIterator]:
            return teeAsyncIterator(asyncProvider, count, init);
        default:
            throw new AsyncSourceTypeError(asyncProvider);
    }
}

function teePromise(promise, count, init) {
    const tees = [];
    for(let i = 0; i < count; i++) {
        init ? Sync.wrap(init, promise) : promise;
        tees.push(init ? Sync.wrap(init, promise) : promise);
    }
    return tees;
}

function teeAsyncIterator(iterator, count, init) {
    const multicast = new Multicast(iterator);
    const tees = [];
    for(let i = 0; i < count; i++) {
        const subscriber = multicast.subscriber();
        tees.push(init ? Sync.wrap(init, subscriber) : subscriber);
    }
    return tees;
}
