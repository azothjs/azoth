
export function use(asyncSource, ...args) {
    const [transforms, options] = processArguments(args);
    const type = typeof asyncSource;

    switch(true) {
        case asyncSource instanceof Promise:
            return transforms.length < 2
                ? [fromPromise(asyncSource, transforms[0], options)]
                : branchPromise(asyncSource, transforms, options);
        default:
            throwAsyncSourceTypeError(type);
    }
}

function fromPromise(promise, transform, options) {
    const startWith = options?.startWith;
    if(startWith) {
        return fromPromiseStartWith(promise, transform, startWith);
    }
    return [transform ? promise.then(transform) : promise];
}

function branchPromise(promise, transforms) {
    return transforms.map(transform => {
        if(Array.isArray(transform)) {       // [transform,    options]
            return fromPromise(promise, transform[0], transform[1]);
        }
        return promise.then(transform);
    });
}

async function* fromPromiseStartWith(promise, transform, startWith) {
    yield startWith;
    yield transform ? promise.then(transform) : promise;
}

function throwAsyncSourceTypeError(type) {
    throw new TypeError(`\
Unexpected asynchronous data source type "${type}". Expected an async data provider type, or \
a function that returns an async data provider type."`);
}

function processArguments(transforms) {
    let options = null;
    if(transforms.length) {
        const maybeOptions = transforms.at(-1);
        if(typeof maybeOptions === 'object') {
            options = maybeOptions;
            transforms.length--;
        }
    }
    return [transforms, options];
}
