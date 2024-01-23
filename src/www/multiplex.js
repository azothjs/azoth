export function multiplex(promise, outlets) {
    const list = Object.entries(outlets).map(([key, handler]) => {
        const { promise, resolve, reject } = Promise.withResolvers();
        return { entry: [key, promise], resolve, reject, handler };
    });

    promise.then(data => {
        list.forEach(({ resolve, handler }) => {
            resolve(handler(data));
        });
    });

    const keyPromiseEntries = list.map(({ entry }) => entry);
    return Object.fromEntries(keyPromiseEntries);
}
