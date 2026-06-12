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
 * chronos's lightweight async-generator factory. Pure platform primitives:
 * Promise.withResolvers + async function*. No dependency on maya or any
 * downstream rendering concern. If a consumer wants to pair an initial
 * render value with this stream, they do that at their own layer (e.g.
 * maya's <Channel source={iter}>loading…</Channel>).
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
