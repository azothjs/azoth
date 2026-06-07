/**
 * Channel — recognized by compose via `instanceof Channel`. The class IS
 * the JSX component: one class, two roles, one definition.
 *
 *   JSX form:
 *     <Channel source={x} as={Y}>loading</Channel>
 *
 *   Direct (equivalent):
 *     new Channel({ source: x, as: Y }, loadingDom)
 *
 * Both produce an instance with `.initial` and `.source`. compose.js
 * checks `instanceof Channel` to recognize either.
 *
 * Props:
 *   - `source` — Promise, async iterable, or Observable (anything with
 *                `.subscribe`). Async iterable covers async generators,
 *                modern ReadableStreams (have `[Symbol.asyncIterator]`),
 *                and any other AsyncIterable.
 *   - `as`     — optional transform; applied to each value the source
 *                produces.
 *   - `error`  — optional transform; applied to errors from the source.
 *                Without it, source errors propagate uncaught.
 *   - `map`    — optional boolean. When the source value has `.map`
 *                (Array, TypedArray, etc.), applies `as` per element
 *                instead of to the whole collection.
 *   - `append` — optional boolean. When set, the first source value
 *                replaces the initial render and subsequent values
 *                append rather than replace. Without it (the default),
 *                each source value replaces the previous. Has no visible
 *                effect on Promise sources (single value).
 *
 * Children (JSX) or the second constructor argument (direct) become the
 * initial render value. The initial value does NOT go through `as`.
 */
export class Channel {

    // Private fields make .initial, .source, and .append read-only after
    // construction. The class is exported (it has to be — JSX needs the
    // identifier), but instances are immutable to outside code. The
    // conventional surface is <Channel> JSX or `new Channel(props, childNodes)`;
    // direct mutation isn't part of the contract.
    #initial;
    #source;
    #append;

    constructor(props, childNodes) {
        const {
            source,
            as: rawTransform,
            map,
            error: errorTransform,
            append,
        } = props || {};

        // `map` wraps the transform to apply per-element on array-shaped
        // values. <Channel source={fetchUsers()} as={User} map/> renders
        // one DOM node per user.
        let transform = rawTransform;
        if(map && rawTransform) {
            const inner = rawTransform;
            transform = value => value?.map ? value.map(inner) : inner(value);
        }

        this.#initial = childNodes;
        this.#source = makeSource(source, transform, errorTransform);
        this.#append = !!append;
    }

    get initial() { return this.#initial; }
    get source() { return this.#source; }
    get append() { return this.#append; }
}

function makeSource(source, transform, errorTransform) {
    if(source === undefined || source === null) {
        return source;
    }
    switch(true) {
        case source instanceof Promise:
            return fromPromise(source, transform, errorTransform);
        case !!source[Symbol.asyncIterator]:
            // Covers async generators, modern ReadableStreams, and any
            // other AsyncIterable. Stream errors land in the try/catch
            // and route through errorTransform like any other iter error.
            return fromAsyncIterable(source, transform, errorTransform);
        case typeof source.subscribe === 'function':
            return fromObservable(source, transform, errorTransform);
        default:
            throw new TypeError(
                `Channel: unsupported source type "${typeof source}". ` +
                `Expected Promise, async iterable, or Observable.`
            );
    }
}

function fromPromise(source, transform, errorTransform) {
    let p = transform ? source.then(transform) : source;
    if(errorTransform) p = p.catch(errorTransform);
    return p;
}

async function* fromAsyncIterable(iter, transform, errorTransform) {
    try {
        for await(const value of iter) {
            yield transform ? transform(value) : value;
        }
    }
    catch(err) {
        if(errorTransform) yield errorTransform(err);
        else throw err;
    }
}

// Sentinel for observable completion — distinguishable from any user value.
const COMPLETE = Symbol('Channel.observable.complete');

async function* fromObservable(observable, transform, errorTransform) {
    const queue = [];           // normal `next` values (go through transform)
    let pending = null;         // { resolve, reject } when consumer is awaiting
    let completed = false;
    let errored = null;
    let errorValue = undefined; // result of errorTransform(err); bypasses transform
    let hasErrorValue = false;

    const subscription = observable.subscribe({
        next(value) {
            if(pending) {
                const { resolve } = pending;
                pending = null;
                resolve(value);
            }
            else {
                queue.push(value);
            }
        },
        error(err) {
            if(errorTransform) {
                errorValue = errorTransform(err);
                hasErrorValue = true;
                completed = true;
                if(pending) {
                    const { resolve } = pending;
                    pending = null;
                    resolve(COMPLETE);
                }
            }
            else {
                errored = err;
                if(pending) {
                    const { reject } = pending;
                    pending = null;
                    reject(err);
                }
            }
        },
        complete() {
            completed = true;
            if(pending) {
                const { resolve } = pending;
                pending = null;
                resolve(COMPLETE);
            }
        }
    });

    try {
        while(true) {
            if(queue.length > 0) {
                const value = queue.shift();
                yield transform ? transform(value) : value;
                continue;
            }
            if(errored) throw errored;
            if(completed) {
                if(hasErrorValue) {
                    hasErrorValue = false;
                    yield errorValue;  // bypasses transform
                }
                return;
            }

            const value = await new Promise((resolve, reject) => {
                pending = { resolve, reject };
            });
            if(value === COMPLETE) continue;  // loop checks completed/errorValue
            yield transform ? transform(value) : value;
        }
    }
    finally {
        // Unsubscribe whether we exited normally, threw, or were aborted.
        if(typeof subscription?.unsubscribe === 'function') {
            subscription.unsubscribe();
        }
    }
}
