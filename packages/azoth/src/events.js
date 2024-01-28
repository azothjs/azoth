export function getTrigger(adaptor) {
    const relay = { call: null };
    function control(payload) {
        if(adaptor) payload = adaptor(payload);
        relay.call(payload);
    }

    return { control, relay };
}

export function operator(adaptor) {
    const { control, relay } = getTrigger(adaptor);

    async function* emitter(initial) {
        yield initial;
        while(true) {
            const { promise, resolve } = Promise.withResolvers();
            relay.call = resolve;
            yield await promise;
        }
    }

    return [control, emitter];
}

export function collect(initial, adaptor) {
    const [control, emitter] = operator(adaptor);
    return [control, emitter(initial)];
}