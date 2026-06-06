import { Channel } from '../channels/channel.js';

export const IGNORE = Symbol.for('azoth.compose.IGNORE');

export function compose(anchor, input, keepLast, props, childNodes) {
    if(keepLast !== true) keepLast = false;
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
        case input instanceof Channel:
            compose(anchor, input.initial, keepLast);
            compose(anchor, input.source, keepLast, props, childNodes);
            break;
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
        // A pre-built Node returned from a component or passed as a value
        // is valid output. Props are NOT overlaid — component invocation
        // means "construct"; if you want to modify a node, do it directly.
        case input instanceof Node:
            return input;
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

            // Channel and other value-bearing types go through compose
            // (value position) rather than create (component position).
            // create() now rejects primitives in component position; the
            // initial/source of a Channel is a VALUE that may well be
            // a primitive (a loading-state string, a number, etc.), so
            // compose is the correct path.
            if(input instanceof Channel) {
                compose(anchor, input.initial);
                compose(anchor, input.source, false, props, childNodes);
            }
            else if(input[Symbol.asyncIterator]) {
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

async function composeAsyncIterator(anchor, iterator, keepLast, props, childNodes) {
    // TODO: use iterator directly and 
    // - control return when removed, and maybe throws on error
    // - possible yield/return semantics for third communication channel
    for await(const value of iterator) {
        compose(anchor, value, keepLast, props, childNodes);
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
