import { pushable } from './pushable.js';

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
 *   - `source`    — Promise, async iterable, Observable (anything with
 *                   `.subscribe`), or EventTarget. Async iterable covers
 *                   async generators, modern ReadableStreams (have
 *                   `[Symbol.asyncIterator]`), and any other AsyncIterable.
 *                   EventTarget requires `eventType`.
 *   - `eventType` — required when `source` is an EventTarget; the name
 *                   of the event to listen for (e.g. "click", "message").
 *                   Mismatched with non-EventTarget sources is an error.
 *   - `as`        — optional transform; applied to each value the source
 *                   produces. For EventTarget, receives the Event object.
 *   - `error`     — optional transform; applied to errors from the source.
 *                   Without it, source errors propagate uncaught.
 *                   (EventTarget has no error channel — this only catches
 *                   transform exceptions for that source type.)
 *   - `map`       — optional boolean. When the source value has `.map`
 *                   (Array, TypedArray, etc.), applies `as` per element
 *                   instead of to the whole collection.
 *   - `append`    — optional boolean. When set, the first source value
 *                   replaces the initial render and subsequent values
 *                   append rather than replace. Without it (the default),
 *                   each source value replaces the previous. Has no
 *                   visible effect on Promise sources (single value).
 *
 * Children (JSX) or the second constructor argument (direct) become the
 * initial render value. The initial value does NOT go through `as`.
 *
 * Update (in component position, under a rerenderer): `update(props,
 * childNodes)` is the change channel. Same `source` reference → no-op (the
 * live subscription keeps flowing, no flash, no double-subscribe). New
 * `source` reference → the prior subscription is torn down internally (an
 * AbortController fires; generators unsubscribe / removeEventListener / stop)
 * and a fresh Channel is returned to drive the new source. This is INTERNAL
 * resource management — Channel owns its subscription. An external abort
 * signal (a prop fired from outside) is separate, unbuilt work.
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
    // The original source reference (pre-makeSource), kept for update()'s
    // identity compare, and the internal teardown controller for this
    // instance's subscription.
    #sourceRef;
    #controller;

    constructor(props, childNodes) {
        const {
            source,
            as: rawTransform,
            map,
            error: errorTransform,
            append,
            eventType,
        } = props || {};

        // `map` wraps the transform to apply per-element on array-shaped
        // values. <Channel source={fetchUsers()} as={User} map/> renders
        // one DOM node per user.
        let transform = rawTransform;
        if(map && rawTransform) {
            const inner = rawTransform;
            transform = value => value?.map ? value.map(inner) : inner(value);
        }

        this.#sourceRef = source;
        this.#controller = new AbortController();
        this.#initial = childNodes;
        this.#source = makeSource(
            source, transform, errorTransform, eventType, this.#controller.signal,
        );
        this.#append = !!append;
    }

    get initial() { return this.#initial; }
    get source() { return this.#source; }
    get append() { return this.#append; }

    // The update verb (component position, rerenderer active). Identity on
    // the source ref: unchanged → no-op (undefined; keep the running
    // subscription). Changed → abort this instance's consumption (prompt
    // internal teardown) and hand back a fresh Channel as the replacement;
    // composeComponent caches and drives it (new initial + new source).
    update(props, childNodes) {
        if((props?.source) === this.#sourceRef) return;
        this.#controller.abort();
        return new Channel(props, childNodes);
    }
}

// compose ignores this (no-op slot); a stale Promise resolves to it after
// the Channel has switched sources. Matches compose.js's exported sentinel
// by registry symbol — no import (avoids the compose↔channel cycle).
const IGNORE = Symbol.for('azoth.compose.IGNORE');

// Resolves to ABORTED when the signal fires — raced against each pending
// pull so a switch interrupts a parked `await` promptly instead of waiting
// for the abandoned source to produce its next value.
const ABORTED = Symbol('Channel.aborted');
function aborted(signal) {
    return new Promise(resolve => {
        if(signal.aborted) resolve(ABORTED);
        else signal.addEventListener('abort', () => resolve(ABORTED), { once: true });
    });
}

function makeSource(source, transform, errorTransform, eventType, signal) {
    if(source === undefined || source === null) {
        return source;
    }
    // eventType ⟺ EventTarget — pair the two together. Either both or
    // neither; mismatch is a usage error worth surfacing at construction.
    if(eventType) {
        if(!(source instanceof EventTarget)) {
            throw new TypeError(
                `Channel: \`eventType\` was provided but source is not an EventTarget. ` +
                `eventType is only valid with EventTarget sources (e.g. an element, ` +
                `WebSocket, BroadcastChannel, MediaQueryList).`
            );
        }
        return fromEventTarget(source, eventType, transform, errorTransform, signal);
    }
    if(source instanceof EventTarget) {
        throw new TypeError(
            `Channel: source is an EventTarget but no \`eventType\` was provided. ` +
            `Specify which event to listen for: ` +
            `<Channel source={target} eventType="message" as={...}/>`
        );
    }
    switch(true) {
        case source instanceof Promise:
            return fromPromise(source, transform, errorTransform, signal);
        case !!source[Symbol.asyncIterator]:
            // Covers async generators, modern ReadableStreams, and any
            // other AsyncIterable. Stream errors land in the try/catch
            // and route through errorTransform like any other iter error.
            return fromAsyncIterable(source, transform, errorTransform, signal);
        case typeof source.subscribe === 'function':
            return fromObservable(source, transform, errorTransform, signal);
        default:
            throw new TypeError(
                `Channel: unsupported source type "${typeof source}". ` +
                `Expected Promise, async iterable, Observable, or EventTarget.`
            );
    }
}

function fromPromise(source, transform, errorTransform, signal) {
    let p = transform ? source.then(transform) : source;
    if(errorTransform) p = p.catch(errorTransform);
    // A promise can't be cancelled, only ignored: if the Channel switched
    // sources before this resolved, neutralize the stale result so it can't
    // clobber the current content. compose treats IGNORE as a no-op slot.
    return p.then(value => signal.aborted ? IGNORE : value);
}

async function* fromAsyncIterable(iter, transform, errorTransform, signal) {
    const it = iter[Symbol.asyncIterator]();
    const stop = aborted(signal);
    try {
        while(!signal.aborted) {
            // Race the pull against the abort so a switch interrupts a parked
            // await; the abandoned next() is left to settle and be ignored.
            const next = await Promise.race([it.next(), stop]);
            if(next === ABORTED || signal.aborted) break;
            const { value, done } = next;
            if(done) break;
            yield transform ? transform(value) : value;
        }
    }
    catch(err) {
        if(errorTransform) yield errorTransform(err);
        else throw err;
    }
    finally {
        // Best-effort upstream cleanup (a user generator's own finally).
        it.return?.();
    }
}

async function* fromEventTarget(target, eventType, transform, errorTransform, signal) {
    // pushable bridges the EventTarget's push model into pull-based async
    // iteration. The listener pushes each event into the iterator; the
    // try/finally guarantees we removeEventListener whether the consumer
    // exits normally, throws, or is aborted (source switched / slot removed).
    const [iter, push] = pushable();
    const it = iter[Symbol.asyncIterator]();
    const stop = aborted(signal);
    target.addEventListener(eventType, push);
    try {
        while(!signal.aborted) {
            const next = await Promise.race([it.next(), stop]);
            if(next === ABORTED || signal.aborted) break;
            const { value, done } = next;
            if(done) break;
            yield transform ? transform(value) : value;
        }
    }
    catch(err) {
        // EventTarget itself has no error channel — this catches exceptions
        // thrown by `transform` for parity with other source types.
        if(errorTransform) yield errorTransform(err);
        else throw err;
    }
    finally {
        it.return?.();
        target.removeEventListener(eventType, push);
    }
}

// Sentinel for observable completion — distinguishable from any user value.
const COMPLETE = Symbol('Channel.observable.complete');

async function* fromObservable(observable, transform, errorTransform, signal) {
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

    // Unsubscribe exactly once — abort fires it promptly (synchronous with the
    // source switch); the finally is the catch-all for normal/error exits.
    let torn = false;
    const teardown = () => {
        if(torn) return;
        torn = true;
        if(typeof subscription?.unsubscribe === 'function') subscription.unsubscribe();
    };
    const onAbort = () => {
        teardown();
        completed = true;
        if(pending) {
            const { resolve } = pending;
            pending = null;
            resolve(COMPLETE);
        }
    };
    signal.addEventListener('abort', onAbort, { once: true });

    try {
        while(true) {
            if(signal.aborted) return;
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
        signal.removeEventListener('abort', onAbort);
        teardown();
    }
}
