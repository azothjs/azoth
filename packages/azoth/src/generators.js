export function signalRelay(send, adaptor) {
    const relay = { send };
    function signal(payload) {
        if(adaptor) payload = adaptor(payload);
        relay.send(payload);
    }
    return [signal, relay];
}

// export function junction2(promise, resolve, relay) {
//     async function* generator(initial) {
//         resolve();
//         await promise;
//         yield initial;

//         while(true) {
//             const { promise, resolve } = Promise.withResolvers();
//             relay.send = resolve;
//             yield await promise;
//         }
//     }

//     return generator;
// }

// export function junction(adaptor) {
//     const { promise, resolve } = Promise.withResolvers();
//     const [signal, relay] = signalRelay(resolve, adaptor);

//     const generator = junction2(promise, resolve, relay);
//     return [signal, generator];
// }

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

export function subject(initial, adaptor) {
    const [signal, generator] = junction(adaptor);
    return [signal, generator(initial)];
}