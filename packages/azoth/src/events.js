export function eventOperator(adaptor) {
    let nextResolve = null;
    function listener(payload) {
        // if(adaptor) payload = adaptor(payload);
        nextResolve(payload);
    }

    async function* operator(initial) {
        yield initial;
        while(true) {
            const { promise, resolve } = Promise.withResolvers();
            nextResolve = resolve;
            yield await promise;
        }
    }

    return { operator, listener };
}
