import { ConflictingOptionsError, OptionMissingFunctionArgumentError } from './throw.js';

function resolveOptions(options, transform) {
    let initialValue, startWith, map = false;
    if(options) {
        initialValue = options.initialValue;
        startWith = options.startWith;
        map = options.map ?? false;
        if(initialValue !== undefined) {
            if(startWith !== undefined) new ConflictingOptionsError();
            if(!transform) throw new OptionMissingFunctionArgumentError('initialValue');
        }
        if(map && !transform) {
            throw new OptionMissingFunctionArgumentError();
        }
    }
    return { initialValue, startWith, map };
}

export function subject(transform, options) {
    if(!options && typeof transform === 'object') {
        options = transform;
        transform = null;
    }

    const { initialValue, startWith, map } = resolveOptions(options, transform);

    const relay = { resolve: null };

    let unsentEarlyDispatch = null;

    function dispatch(payload) {
        if(transform) {
            if(map) payload = payload.map(transform);
            else payload = transform(payload);
        }

        if(relay.resolve) relay.resolve(payload);
        else {
            // eslint-disable-next-line eqeqeq
            if(payload != null) unsentEarlyDispatch = payload;
        }
    }

    async function* generator() {
        let promise = null;
        let resolve = null;

        if(initialValue !== undefined) {
            yield transform(initialValue);
        }
        if(startWith !== undefined) {
            yield startWith;
        }
        // this handles dispatch that happens between 
        // initial/start yields and main loop:
        // eslint-disable-next-line eqeqeq
        while(unsentEarlyDispatch != null) {
            const toYield = unsentEarlyDispatch;
            unsentEarlyDispatch = null;
            yield toYield;
        }

        while(true) {
            ({ promise, resolve } = Promise.withResolvers());
            relay.resolve = resolve;
            yield await promise;
        }
    }

    const asyncIterator = generator();
    return [asyncIterator, dispatch];
}


export function multicast(iterator) {
    return new Multicast(iterator);
}

export class Multicast {
    #consumers = [];

    constructor(subject) {
        this.subject = subject;
        this.#start();
    }

    async #start() {
        for await(let value of this.subject) {
            for(let consumer of this.#consumers) {
                consumer(value);
            }
        }
    }

    subscriber(transform, options) {
        const [iterator, dispatch] = subject(transform, options);
        this.#consumers.push(dispatch);
        return iterator;
    }
}
