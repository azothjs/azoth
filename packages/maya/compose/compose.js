import { Channel } from '../channels/channel.js';
import { activeRerenderer } from '../renderer/rerenderer.js';

export const IGNORE = Symbol.for('azoth.compose.IGNORE');

export function compose(anchor, input, keepLast, props, childNodes) {
    if(keepLast !== true) keepLast = false;

    // The identical value at an anchor is one instruction, not two.
    // Only consulted during a synchronous rerender pass (async
    // continuations run after the pass — stack empty, no skip), and
    // only on the replace path: keepLast=true means accumulate, where
    // a repeated value is a legitimate "add another."
    if(!keepLast) {
        const rr = activeRerenderer();
        if(rr && rr.skipIfSame(anchor, input)) return;
    }

    const type = typeof input;

    switch(true) {
        case input === IGNORE:
            break;
        case input === undefined:
        case input === null:
        case input === true:
        case input === false:
        case input === '':
            if(!keepLast) clear(anchor);
            break;
        case type === 'number':
        case type === 'bigint':
            input = `${input}`;
        // eslint-disable-next-line no-fallthrough
        case type === 'string':
            replace(anchor, input, keepLast);
            break;
        case input instanceof Node:
            replace(anchor, input, keepLast);
            break;
        case input instanceof Channel: {
            compose(anchor, input.initial, keepLast);
            const { source, append } = input;
            // No source — initial-only Channel; leave the initial in place.
            if(source === undefined || source === null) break;
            if(source instanceof Promise) {
                // Single value always replaces the initial. `append` has
                // no effect on Promise sources (only one value to emit).
                source.then(value => compose(anchor, value, false, props, childNodes));
                break;
            }
            // Async iterable. Channel's makeSource normalizes async
            // generators, Observables, and ReadableStreams into this shape.
            // When `append` is true, composeAsyncIterator's firstReplaces
            // flag makes the first value clear the initial and subsequent
            // values accumulate.
            composeAsyncIterator(anchor, source, append, props, childNodes, append);
            break;
        }
        case type === 'function': {
            // will throw if function is class,
            // unlike create or compose element
            let out = input(props, childNodes);
            compose(anchor, out, keepLast);
            break;
        }
        case type !== 'object': {
            // ES2023: Symbol should be only type  
            throwTypeError(input, type);
            break;
        }
        case input instanceof Promise:
            input.then(value => compose(anchor, value, keepLast, props, childNodes));
            break;
        case Array.isArray(input):
            composeArray(anchor, input, keepLast);
            break;
        // ReadableStream must come before the asyncIterator check — modern
        // ReadableStream implements [Symbol.asyncIterator], so without this
        // ordering the stream would be consumed via for-await (replace
        // semantics) instead of pipeTo (accumulate semantics).
        case input instanceof ReadableStream:
            // no props and childNodes propagation on streams
            composeStream(anchor, input, true);
            break;
        // w/o the !! this causes intermittent failures :p maybe vitest/node thing?
        case !!input[Symbol.asyncIterator]:
            composeAsyncIterator(anchor, input, keepLast, props, childNodes);
            break;
        case typeof input?.render === 'function': {
            let out = childNodes
                ? input.render(props, childNodes)
                : props ? input.render(props) : input.render();
            compose(anchor, out, keepLast);
            break;
        }
        case typeof input.subscribe === 'function':
            // Observable shape per the TC39 proposal (RxJS-compatible).
            // Subscribe directly: each `next` value flows through compose.
            // Errors re-throw — surfaces as unhandled, matching how a raw
            // async iterator throwing in this slot behaves. Complete is a
            // no-op; the slot keeps its last value. Use <Channel error={...}>
            // for handled errors.
            input.subscribe({
                next(value) { compose(anchor, value, keepLast, props, childNodes); },
                error(err) { throw err; },
                complete() { }
            });
            break;
        default: {
            throwTypeErrorForObject(input);
        }
    }
}

export function composeComponent(anchor, [Constructor, props, childNodes]) {
    // if renderer "updating":
    // - get render source, by anchor
    // - call render with props/childNodes
    // - return

    createCompose(Constructor, props, childNodes, anchor);
    // if renderer "recording"
    // - store render source, by anchor

}

export function createCompose(Constructor, props, childNodes, anchor) {
    const out = create(Constructor, props, childNodes, anchor);
    if(out !== anchor) compose(anchor, out);
}

export function createComponent(Constructor, props, childNodes) {
    let result = create(Constructor, props, childNodes, null);

    switch(typeof result) {
        case 'number':
        case 'bigint':
            result = `${result}`;
        // eslint-disable-next-line no-fallthrough
        case 'string':
            return document.createTextNode(result);
        default:
            return result;
    }
}

function create(input, props, childNodes, anchor) {
    const type = typeof input;

    switch(true) {
        // Reject Node-as-component. This was the residue of the removed
        // DOM-overlay (skinning) path: the Object.assign went, the
        // passthrough lingered. Component invocation means "construct" —
        // create needs to actually produce something. A pre-built Node is
        // a VALUE: interpolate it ({node}), don't invoke it (<Node/>).
        case input instanceof Node:
            throw new TypeError(
                `Cannot use a DOM Node as a component. ` +
                `Components construct DOM; a pre-built Node is a value. ` +
                `Interpolate it instead: {node} rather than <Node/>.`
            );
        // Empty / nothing values render to no DOM.
        case input === undefined:
        case input === null:
        case input === true:
        case input === false:
        case input === '':
        case input === IGNORE:
            return null;
        // Function: invoke with props/childNodes.
        case !!(input.prototype?.constructor): {
            // class and function(){} — invoked with `new`
            // eslint-disable-next-line new-cap
            return new input(props, childNodes);
        }
        case type === 'function': {
            // arrow () => {} — called directly
            return input(props, childNodes) ?? null;
        }
        // Reject primitive-as-component. Strings, numbers, bigints in
        // component position are almost always a mistake. Catch early.
        case type === 'string':
        case type === 'number':
        case type === 'bigint':
        case type === 'symbol':
            throwPrimitiveAsComponent(input, type);
            break;
        case type !== 'object': {
            throwTypeError(input, type);
            break;
        }
        case typeof input?.render === 'function':
            return input.render(props, childNodes) ?? null;
        default: {
            let container = anchor;
            if(!container) {
                anchor = document.createComment('0');
                container = document.createDocumentFragment();
                container.append(anchor);
            }

            // Value-position types — JSX puts a CLASS in component position
            // and the constructor branch above handles it. Pre-built instances
            // (Channel, Promise, async iterable, array) reach create() only
            // when the caller hands a value directly, which the compose()
            // entry handles natively. Keep these as a safety net for now.
            if(input[Symbol.asyncIterator]) {
                composeAsyncIterator(anchor, input, false, props, childNodes);
            }
            else if(input instanceof Promise) {
                input.then(value => compose(anchor, value, false, props, childNodes));
            }
            else if(Array.isArray(input)) {
                composeArray(anchor, input, false);
            }
            else {
                throwTypeErrorForObject(input, type);
            }

            return container;
        }
    }
}

/* replace and clear */

function replace(anchor, input, keepLast) {
    if(!keepLast) clear(anchor);
    anchor.before(input);
    anchor.data = ++anchor.data;
}

function clear(anchor) {
    let node = anchor;
    let count = +anchor.data;

    // TODO: validate count received

    while(count--) {
        const { previousSibling } = node;
        if(!previousSibling) break;

        // TODO: how to guard for azoth comments only?
        if(previousSibling.nodeType === Node.COMMENT_NODE) {
            clear(previousSibling);
        }

        previousSibling.remove();
    }

    anchor.data = 0;
}

/* complex types */

function composeArray(anchor, array, keepLast) {
    if(!keepLast) clear(anchor);
    // TODO: optimize arrays here if Node[] research shows gain.
    // vanillajs-1 in jsperf benchmarks has specific numbers
    for(let i = 0; i < array.length; i++) {
        compose(anchor, array[i], true);
    }
}

async function composeStream(anchor, stream, keepLast) {
    stream.pipeTo(new WritableStream({
        write(chunk) {
            compose(anchor, chunk, keepLast);
        }
    }));
}

async function composeAsyncIterator(
    anchor, iterator, keepLast, props, childNodes, firstReplaces = false,
) {
    // TODO: use iterator directly and
    // - control return when removed, and maybe throws on error
    // - possible yield/return semantics for third communication channel
    //
    // `firstReplaces` is set by the Channel branch when `append` is true:
    // the first iteration overrides keepLast to false so it clears the
    // initial render; subsequent iterations honor keepLast (true →
    // accumulate). For non-Channel callers, `firstReplaces` defaults to
    // false so behavior is unchanged.
    let first = true;
    for await(const value of iterator) {
        const effective = (first && firstReplaces) ? false : keepLast;
        compose(anchor, value, effective, props, childNodes);
        first = false;
    }
}

/* thrown errors */

function throwTypeError(input, type, footer = '') {
    // Passing Symbol to `{...}` throws!
    if(type === 'symbol') input = 'Symbol';
    throw new TypeError(`\
Invalid compose {...} input type "${type}", value ${input}.\
${footer}`
    );
}

function throwPrimitiveAsComponent(input, type) {
    const display = type === 'symbol' ? 'Symbol' : JSON.stringify(input);
    throw new TypeError(
        `Cannot use ${type} (${display}) as a component. ` +
        `Components must be functions, classes, or objects with a render() method. ` +
        `If you want to render a primitive value, interpolate it directly: {value} instead of <Value/>.`
    );
}

function throwTypeErrorForObject(obj) {
    let message = '';
    try {
        const fnName = obj.constructor?.name;
        if(fnName === 'Object') {
            message += `\n\nDid you mean to include a "render" method?`;
        }
        else if(fnName) {
            message += `\n\nDid you forget to return a value from "${fnName}"\
if a function, or a "render" method if a class?`;
        }
        const json = JSON.stringify(obj, null, 2);
        message += `\n\nReceived as:\n\n${json}\n\n`;
    }
    catch(ex) {
        /* no-op */
    }
    throwTypeError(obj, 'object', message);
}
