
function withResolvers() {
    let resolve = null, reject = null;
    const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}

export function eventOperator(adaptor) {
    let nextResolve = null;
    function listener(payload) {
        // if(adaptor) payload = adaptor(payload);
        nextResolve(payload);
    }

    async function* operator(initial) {
        yield initial;
        while(true) {
            const { promise, resolve } = withResolvers();
            nextResolve = resolve;
            yield await promise;
        }
    }

    return { operator, listener };
}
