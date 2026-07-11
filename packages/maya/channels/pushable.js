/**
 * pushable() → [asyncIterator, push]
 *
 * A push-driven async iterator. The bridge from callback/listener APIs
 * (which push values when they arrive) to pull-based iteration (which
 * compose consumes). The mismatch — push side fires on the source's
 * schedule, pull side wants "give me the next one whenever it arrives" —
 * is buffered between them via a FIFO queue plus a pending-resolver slot.
 *
 *   const [events$, push] = pushable();
 *   target.addEventListener('foo', push);   // listener bridge
 *   subscription.onValue = push;            // any callback API
 *
 *   <Channel source={events$} as={Event} />
 *
 * Values pushed before the iterator is consumed are queued (FIFO) and
 * yielded in order once iteration begins. Values pushed while the consumer
 * is awaiting `.next()` wake the pending resolver immediately.
 *
 * No transform — if you want per-value transformation, do it at the push
 * call site or downstream (Channel's `as` prop, iterator helpers).
 * pushable is the bridge; transforms are someone else's job.
 *
 * Single-consumer. Async iterators are not shareable; if you need fan-out,
 * lift the source into an EventTarget (naturally multi-listener) and use
 * Channel's EventTarget integration per consumer.
 *
 * @returns {[AsyncIterableIterator<any>, (value: any) => void]} the tuple —
 *   without this annotation TS infers an array-of-union and destructured
 *   `push` isn't callable.
 */
export function pushable() {
    let resolve = null;
    const queue = [];

    function push(value) {
        if(resolve) {
            const r = resolve;
            resolve = null;
            r(value);
        }
        else {
            queue.push(value);
        }
    }

    async function* gen() {
        while(true) {
            if(queue.length > 0) {
                yield queue.shift();
                continue;
            }
            const { promise, resolve: r } = Promise.withResolvers();
            resolve = r;
            yield await promise;
        }
    }

    return [gen(), push];
}
