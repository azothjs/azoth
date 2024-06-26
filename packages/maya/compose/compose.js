export const IGNORE = Symbol.for('azoth.compose.IGNORE');

export class SyncAsync {
    static from(sync, async) {
        return new this(sync, async);
    }
    constructor(sync, async) {
        this.sync = sync;
        this.async = async;
    }
}

export function compose(anchor, input, keepLast, props, slottable) {
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
            if(props) Object.assign(input, props);
            if(slottable) input.slottable = slottable;
            replace(anchor, input, keepLast);
            break;
        case input instanceof SyncAsync:
            compose(anchor, input.sync, keepLast);
            compose(anchor, input.async, keepLast, props, slottable);
            break;
        case type === 'function': {
            // will throw if function is class,
            // unlike create or compose element
            let out = input(props, slottable);
            compose(anchor, out, keepLast);
            break;
        }
        case type !== 'object': {
            // ES2023: Symbol should be only type  
            throwTypeError(input, type);
            break;
        }
        case input instanceof Promise:
            input.then(value => compose(anchor, value, keepLast, props, slottable));
            break;
        case Array.isArray(input):
            composeArray(anchor, input, keepLast);
            break;
        // w/o the !! this causes intermittent failures :p maybe vitest/node thing?
        case !!input[Symbol.asyncIterator]:
            composeAsyncIterator(anchor, input, keepLast, props, slottable);
            break;
        case input instanceof ReadableStream:
            // no props and slottable propagation on streams
            composeStream(anchor, input, true);
            break;
        case isRenderObject(input): {
            let out = slottable
                ? input.render(props, slottable)
                : props ? input.render(props) : input.render();
            compose(anchor, out, keepLast);
            break;
        }
        // TODO:
        case !!input.subscribe:
        case !!input.on:
        default: {
            throwTypeErrorForObject(input);
        }
    }
}

/**
 * Duck type test for render object
 * @param {object} obj 
 * @returns {boolean}
 */
const isRenderObject = obj => typeof obj?.render === 'function';

export function composeComponent(anchor, [Constructor, props, slottable]) {
    createCompose(Constructor, props, slottable, anchor);
}

export function createCompose(Constructor, props, slottable, anchor) {
    const out = create(Constructor, props, slottable, anchor);
    if(out !== anchor) compose(anchor, out);
}

export function createComponent(Constructor, props, slottable) {
    let result = create(Constructor, props, slottable, null);

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

function create(input, props, slottable, anchor) {
    const type = typeof input;

    switch(true) {
        case input instanceof Node:
            if(props) Object.assign(input, props);
        // eslint-disable-next-line no-fallthrough
        case type === 'string':
            return input;
        case type === 'number':
        case type === 'bigint':
            return `${input}`;
        case input === undefined:
        case input === null:
        case input === true:
        case input === false:
        case input === '':
        case input === IGNORE:
            return null;
        // class and function(){}
        case !!(input.prototype?.constructor): {
            // eslint-disable-next-line new-cap
            return new input(props, slottable);
        }
        // arrow () => {}
        case type === 'function': {
            return input(props, slottable) ?? null;
        }
        case type !== 'object': {
            throwTypeError(input, type);
            break;
        }
        case isRenderObject(input):
            return input.render(props, slottable) ?? null;
        default: {
            let container = anchor;
            if(!container) {
                anchor = document.createComment('0');
                container = document.createDocumentFragment();
                container.append(anchor);
            }

            if(input instanceof SyncAsync) {
                createCompose(input.sync, props, slottable, anchor);
                createCompose(input.async, props, slottable, anchor);
            }
            else if(input[Symbol.asyncIterator]) {
                composeAsyncIterator(anchor, input, false, props, slottable);
            }
            else if(input instanceof Promise) {
                input.then(value => {
                    createCompose(value, props, slottable, anchor);
                });
            }
            else if(Array.isArray(input)) {
                // TODO: map to createCompose
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

async function composeAsyncIterator(anchor, iterator, keepLast, props, slottable) {
    // TODO: use iterator directly and 
    // - control return when removed, and maybe throws on error
    // - possible yield/return semantics for third communication channel
    for await(const value of iterator) {
        compose(anchor, value, keepLast, props, slottable);
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
