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

export function multicast(iterator) {
    return new Multicast(iterator);
}

class Multicast {
    consumers = [];
    constructor(subject) {
        this.subject = subject;
        this.#start();
    }

    async #start() {
        for await(let value of this.subject) {
            for(let consumer of this.consumers) {
                consumer(value);
            }
        }
    }

    subscriber() {
        const [signal, iterator] = subject();
        this.consumers.push(signal);
        return iterator;
    }
}
