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
            // `error` prop is reserved for a future error-transform pass.
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
        this.source = makeAsyncStream(resolvedSource, transform);
    }
}

function makeAsyncStream(source, transform) {
    if(source === undefined || source === null) {
        return source;
    }
    switch(true) {
        case source instanceof Promise:
            return transform ? source.then(transform) : source;
        case !!source[Symbol.asyncIterator]:
            return fromAsyncIterator(source, transform);
        // ReadableStream and Observable support is planned; see TODO.md.
        default:
            throw new TypeError(
                `Channel: unsupported source type "${typeof source}". ` +
                `Expected Promise, async iterable, or Channel-wrapped value.`
            );
    }
}

async function* fromAsyncIterator(iter, transform) {
    for await(const value of iter) {
        yield transform ? transform(value) : value;
    }
}
