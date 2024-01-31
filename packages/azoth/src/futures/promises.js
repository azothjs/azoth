export function branch(promise, ...outlets) {
    const list = outlets.map(transform => {
        const { promise, resolve, reject } = Promise.withResolvers();
        return { promise, resolve, reject, transform };
    });

    dispatchAsync(promise, list);

    return list.map(({ promise }) => promise);
}

async function dispatchAsync(promise, list) {
    promise.then(data => {
        list.forEach(({ resolve, transform }) => {
            resolve(transform(data));
        });
    });
}

export function keyedBranch(promise, outlets) {
    const list = Object.entries(outlets).map(([key, transform]) => {
        const { promise, resolve, reject } = Promise.withResolvers();
        return { entry: [key, promise], resolve, reject, transform };
    });

    promise.then(data => {
        list.forEach(({ resolve, transform }) => {
            resolve(transform(data));
        });
    });

    const keyPromiseEntries = list.map(({ entry }) => entry);
    return Object.fromEntries(keyPromiseEntries);
}

export async function sleep(ms) {
    const { promise, resolve } = Promise.withResolvers();
    setTimeout(resolve, ms);
    return promise;
}