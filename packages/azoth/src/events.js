export function signalToRelay(send, adaptor) {
    const relay = { send };
    function signal(payload) {
        if(adaptor) payload = adaptor(payload);
        relay.send(payload);
    }
    return [signal, relay];
}

export function signalToEmitter(adaptor) {
    const { promise, resolve } = Promise.withResolvers();
    const [signal, relay] = signalToRelay(resolve, adaptor);

    async function* emitter(initial) {
        resolve();
        await promise;
        yield initial;

        while(true) {
            const { promise, resolve } = Promise.withResolvers();
            relay.send = resolve;
            yield await promise;
        }
    }

    return [signal, emitter];
}

export function signalIterator(initial, adaptor) {
    const [signal, emitter] = signalToEmitter(adaptor);
    return [signal, emitter(initial)];
}