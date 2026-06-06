/**
 * Channel — the duck-typed object compose recognizes, AND the JSX component
 * that produces it. One class, two roles, one definition.
 *
 *   JSX component form:
 *     <Channel source={x} as={Y}>loading</Channel>
 *     → new Channel({ source: x, as: Y }, loadingDom)
 *
 *   Direct class form (equivalent):
 *     new Channel({ source: x, as: Y }, loadingDom)
 *
 * Both produce an instance with `.initial` and `.source`. compose.js
 * checks `instanceof Channel` to recognize either.
 *
 * Props:
 *   - `source` — Promise, async iterable, or another Channel.
 *   - `as`     — optional transform; applied to each value the source
 *                produces.
 *   - `map`    — optional boolean. When the source value is an array,
 *                applies `as` per element instead of to the whole array.
 *                Has no effect on non-array values (transform applies
 *                directly).
 *
 * Children (JSX) or the second constructor argument (direct) become the
 * initial render value. The initial value does NOT go through `as`.
 *
 * Source unwrap: if `source` is itself a Channel (e.g. one returned by
 * chronos's `reduce()` paired with an initial elsewhere — uncommon),
 * the constructor unwraps it and applies `as` to the wrapped initial.
 * Passing both a Channel-wrapped source AND children throws.
 */
export class Channel {

    constructor(props, childNodes) {
        const {
            source,
            as: rawTransform,
            map,
            error: errorTransform,
        } = props || {};

        // `map` wraps the transform to apply per-element on array-shaped
        // values. <Channel source={fetchUsers()} as={User} map/> renders
        // one DOM node per user.
        let transform = rawTransform;
        if(map && rawTransform) {
            const inner = rawTransform;
            transform = value => value?.map ? value.map(inner) : inner(value);
        }

        let initial = childNodes;

        let resolvedSource = source;
        if(source instanceof Channel) {
            if(initial !== undefined) {
                throw new TypeError(
                    'Channel: childNodes cannot be combined with a Channel-wrapped source'
                );
            }
            initial = transform ? transform(source.initial) : source.initial;
            resolvedSource = source.source;
        }

        this.initial = initial;
        this.source = makeAsyncStream(resolvedSource, transform, errorTransform);
    }
}

function makeAsyncStream(source, transform, errorTransform) {
    if(source === undefined || source === null) {
        return source;
    }
    switch(true) {
        case source instanceof Promise: {
            let p = transform ? source.then(transform) : source;
            if(errorTransform) p = p.catch(errorTransform);
            return p;
        }
        case source instanceof ReadableStream:
            // compose.js handles ReadableStream natively (chunk-by-chunk
            // accumulate). With a transform, pipe through a TransformStream
            // so each chunk is transformed.
            // Note: errorTransform is not yet wired into the ReadableStream
            // path — stream errors propagate uncaught for now (see TODO.md).
            return transform ? source.pipeThrough(new TransformStream({
                transform(chunk, controller) {
                    controller.enqueue(transform(chunk));
                }
            })) : source;
        case !!source[Symbol.asyncIterator]:
            return fromAsyncIterator(source, transform, errorTransform);
        case typeof source.subscribe === 'function':
            // Observable shape per the TC39 proposal (RxJS-compatible).
            // Convert to an async iterator so compose's existing
            // async-iteration path handles it.
            return fromObservable(source, transform, errorTransform);
        default:
            throw new TypeError(
                `Channel: unsupported source type "${typeof source}". ` +
                `Expected Promise, async iterable, ReadableStream, ` +
                `Observable, or Channel-wrapped value.`
            );
    }
}

async function* fromAsyncIterator(iter, transform, errorTransform) {
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

// Internal export — used by compose.js for observable-in-child-slot
// handling. Not part of the public Channel API surface.
export async function* fromObservable(observable, transform, errorTransform) {
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
