/**
 * Channel — the duck-typed object compose recognizes, AND the JSX component
 * that produces it. One class, two roles.
 *
 *   class form (data, used internally and by chronos):
 *     Channel.from(initialValue, asyncSource)
 *
 *   JSX component form:
 *     <Channel source={x} as={Y}>loading</Channel>
 *     → new Channel({ source: x, as: Y }, loadingDom)
 *
 * Both produce an instance with `.initial` and `.source`. compose.js checks
 * `instanceof Channel` to recognize either.
 *
 * The bare `channel(source, transform, options)` function below is a legacy
 * compat shim that accepts the old { init, start, map } options from the
 * chronos pipeline (branch/tee/consume). To be removed when chronos is
 * reworked — see packages/chronos/CLEANUP.md.
 */
export class Channel {

    constructor(props, childNodes) {
        const {
            source,
            as: transform,
            // `error` reserved for Phase 6 (error transform). Ignored for now.
            initial: propInitial,
        } = props || {};

        // Initial: explicit `initial` prop wins; otherwise childNodes from
        // JSX (e.g. <Channel>loading</Channel>). Neither = no initial.
        let initial = propInitial !== undefined ? propInitial : childNodes;

        // Unwrap a Channel-wrapped source (e.g. one returned by chronos's
        // reduce()). The wrapped source's `initial` is part of the source's
        // value pipeline, so transform applies to it.
        let resolvedSource = source;
        if(source instanceof Channel) {
            if(initial !== undefined) {
                throw new TypeError(
                    'Channel: "initial" (or childNodes) cannot be combined with a Channel-wrapped source'
                );
            }
            initial = transform ? transform(source.initial) : source.initial;
            resolvedSource = source.source;
        }

        this.initial = initial;
        this.source = makeAsyncStream(resolvedSource, transform);
    }

    /**
     * Direct construction for callers that already have a built async source
     * and want to wrap it with an initial value. Bypasses the constructor's
     * source-wrapping logic. Used by chronos's reduce() and similar.
     */
    static from(initial, source) {
        const c = Object.create(Channel.prototype);
        c.initial = initial;
        c.source = source;
        return c;
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
        // ReadableStream and Observable support added in subsequent commits.
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


/**
 * Legacy function form. Delegates to `new Channel(...)`.
 *
 * Accepted options:
 *   - { initial }: synchronous initial value (no transform). Public.
 *
 * Legacy compat options (deprecated, kept for chronos pipeline; to be
 * removed when chronos is reworked):
 *   - { start }: synonym for `initial` (no transform applied).
 *   - { init }: initial value WITH transform applied.
 *   - { map }: wraps transform to apply per-element on array-shaped values.
 */
export function channel(source, transformOrOptions, options) {
    // Polymorphic: channel(source, options) when middle arg is options-shaped
    // and `options` wasn't passed positionally.
    let transform = transformOrOptions;
    if(options === undefined && transformOrOptions !== undefined
        && transformOrOptions !== null
        && typeof transformOrOptions !== 'function') {
        options = transformOrOptions;
        transform = undefined;
    }

    // Legacy `map` wraps transform to apply per-element on array values.
    if(options?.map && transform) {
        const inner = transform;
        transform = value => value?.map ? value.map(inner) : inner(value);
    }

    // Resolve initial: prefer explicit `initial` > legacy `start` (no
    // transform) > legacy `init` (with transform applied).
    let initial = options?.initial;
    if(initial === undefined) initial = options?.start;
    if(initial === undefined && options?.init !== undefined) {
        initial = transform ? transform(options.init) : options.init;
    }

    return new Channel({ source, as: transform, initial });
}
