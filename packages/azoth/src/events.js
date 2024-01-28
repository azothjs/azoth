export function signalRelay(send, adaptor) {
    const relay = { send };
    function signal(payload) {
        if(adaptor) payload = adaptor(payload);
        relay.send(payload);
    }
    return [signal, relay];
}

export function junction2(relay) {
    const { promise, resolve } = Promise.withResolvers();

    async function* generator(initial) {
        resolve();
        await promise;
        yield initial;

        while(true) {
            const { promise, resolve } = Promise.withResolvers();
            relay.send = resolve;
            yield await promise;
        }
    }

    return generator;
}

export function junction(adaptor) {
    const { promise, resolve } = Promise.withResolvers();
    const [signal, relay] = signalRelay(resolve, adaptor);

    async function* generator(initial) {
        resolve();
        await promise;
        yield initial;

        while(true) {
            const { promise, resolve } = Promise.withResolvers();
            relay.send = resolve;
            yield await promise;
        }
    }

    return [signal, generator];
}

export function pipe(initial, adaptor) {
    const [signal, generator] = junction(adaptor);
    return [signal, generator(initial)];
}