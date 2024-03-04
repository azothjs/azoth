function withResolvers() {
    let resolve = null, reject = null;
    const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}

if(!Promise.withResolvers) {
    Promise.withResolvers = withResolvers;
}