import { Channel } from '../compose/compose.js';

/**
 * channel(source, transform?, options?)
 *
 * Public option: { initial } — synchronous initial value rendered before
 * the source produces its first value. Does NOT go through transform.
 *
 * Legacy options (deprecated, kept for compat with chronos's branch/tee/
 * consume pipeline; will be removed when chronos is reworked):
 *   - { start }: synonym for `initial` (no transform applied)
 *   - { init }: initial value WITH transform applied
 *   - { map }: applies transform to each element of an array-shaped value
 */
export function channel(source, transformOrOptions, options) {
    // Polymorphic call shape: channel(source, options) when middle arg is
    // options-shaped rather than a transform function. Only swap if `options`
    // wasn't explicitly passed — otherwise respect the caller's positional intent
    // (e.g. channel(promise, null, { initial: 'x' }) — middle arg is null
    // "no transform", third arg is options).
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

    // Resolve the user-supplied initial. Preference: explicit `initial` >
    // legacy `start` (no transform) > legacy `init` (with transform).
    let initial = options?.initial;
    if(initial === undefined) initial = options?.start;
    if(initial === undefined && options?.init !== undefined) {
        initial = transform ? transform(options.init) : options.init;
    }

    // Unwrap a Channel-wrapped source (e.g. one returned by chronos's reduce()).
    // The wrapped source's `initial` is part of the source's value pipeline, so
    // the transform applies to it.
    if(source instanceof Channel) {
        if(initial !== undefined || options?.init !== undefined) {
            throw new TypeError(
                'channel: "initial" option cannot be combined with a Channel-wrapped source'
            );
        }
        const wrappedInitial = transform ? transform(source.initial) : source.initial;
        const stream = makeAsyncStream(source.source, transform);
        return Channel.from(wrappedInitial, stream);
    }

    const stream = makeAsyncStream(source, transform);
    return initial !== undefined ? Channel.from(initial, stream) : stream;
}

function makeAsyncStream(source, transform) {
    switch(true) {
        case source instanceof Promise:
            return transform ? source.then(transform) : source;
        case !!source?.[Symbol.asyncIterator]:
            return fromAsyncIterator(source, transform);
        // ReadableStream and Observable support added in subsequent commits.
        default:
            throw new TypeError(
                `channel: unsupported source type "${typeof source}". ` +
                `Expected Promise, async iterable, or Channel-wrapped value.`
            );
    }
}

async function* fromAsyncIterator(iter, transform) {
    for await(const value of iter) {
        yield transform ? transform(value) : value;
    }
}
