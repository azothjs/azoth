/**
 * generator(transform?) → [asyncIterator, dispatch]
 *
 * A push-driven async iterator. Each call to dispatch produces the next
 * value the iterator yields. An optional transform is applied to each
 * dispatched value before it's yielded.
 *
 * Values dispatched before consumption begins are queued (FIFO) and
 * yielded in order once the consumer starts iterating.
 *
 * This is chronos's lightweight async-generator factory. It does NOT
 * produce a Channel (the sync-initial-value concept lives in maya).
 * To pair a generator with an initial render value, wrap it:
 *
 *   const [iter, dispatch] = generator();
 *   <main><Channel source={iter}>loading…</Channel></main>
 *
 * Or, if you have a pre-known initial value to pair with the stream:
 *
 *   const ch = Channel.from(initialValue, iter);
 */
export function generator(transform) {
    const apply = typeof transform === 'function' ? transform : v => v;

    let resolve = null;
    const queue = [];

    function dispatch(payload) {
        const value = apply(payload);
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

    return [gen(), dispatch];
}
