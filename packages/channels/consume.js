import { Multicast } from './generators.js';
import { AsyncSourceTypeError } from './throw.js';

export function consume(asyncSource, ...actions) {
    const type = typeof asyncSource;

    switch(true) {
        case asyncSource instanceof Promise:
            actions.length < 2
                ? consumePromise(asyncSource, actions[0])
                : consumePromises(asyncSource, actions);
            break;
        case !!asyncSource[Symbol.asyncIterator]:
        default:
            throw new AsyncSourceTypeError(asyncSource);
    }
}

function consumePromise(promise, action) {
    promise.then(action);
}

function consumePromises(promise, actions) {
    for(let i = 0; i < actions.length; i++) {
        promise.then(actions[i]);
    }
}

