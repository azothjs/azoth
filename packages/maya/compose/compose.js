/* compose, composeElement, create, createElement */
export const IGNORE = Symbol.for('azoth.compose.IGNORE');

export class Sync {
    static wrap(initial, input) {
        return new this(initial, input);
    }
    constructor(initial, input) {
        this.initial = initial;
        this.input = input;
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
        case input instanceof Sync:
            compose(anchor, input.initial, keepLast);
            compose(anchor, input.input, keepLast, props, slottable);
            break;
        case type === 'function': {
            // will throw if function is class,
            // unlike create or compose element
            let out = slottable
                ? input(props, slottable)
                : props ? input(props) : input();
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

const isRenderObject = obj => obj && typeof obj === 'object' && obj.render && typeof obj.render === 'function';

export function composeElement(anchor, Constructor, props, slottable) {
    create(Constructor, props, slottable, anchor);
}

export function createElement(Constructor, props, slottable, topLevel = false) {
    const result = create(Constructor, props, slottable);
    if(!topLevel) return result;

    // result is returned to caller, not composed by Azoth,
    // force to be of type Node or null:
    // strings and numbers into text nodes
    // non-values to null
    const type = typeof result;
    switch(true) {
        case type === 'string':
        case type === 'number':
            return document.createTextNode(result);
        case result === undefined:
        case result === null:
        case result === true:
        case result === false:
        case result === IGNORE:
            return null;
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
        case type === 'number':
        case input === undefined:
        case input === null:
        case input === true:
        case input === false:
        case input === '':
        case input === IGNORE:
            return anchor ? void compose(anchor, input) : input;
        case !!(input.prototype?.constructor): {
            // eslint-disable-next-line new-cap
            return create(new input(props, slottable), null, null, anchor);
        }
        case type === 'function':
            return create(input(props, slottable), null, null, anchor);
        case type !== 'object': {
            throwTypeError(input, type);
            break;
        }
        case isRenderObject(input):
            return create(input.render(props, slottable), null, null, anchor);
        default: {
            // these inputs require a comment anchor to which they can render
            if(!anchor) anchor = document.createComment('0');

            if(input[Symbol.asyncIterator]) {
                composeAsyncIterator(anchor, input, false, props, slottable);
            }
            else if(input instanceof Promise) {
                input.then(value => {
                    create(value, props, slottable, anchor);
                });
            }
            else if(Array.isArray(input)) {
                composeArray(anchor, input, false);
            }
            else if(input instanceof Sync) {
                // REASSIGN anchor! sync input will compose _before_
                // anchor is appended to DOM, need container until then
                const commentAnchor = anchor;
                anchor = document.createDocumentFragment();
                anchor.append(commentAnchor);

                create(input.initial, props, slottable, commentAnchor);
                create(input.input, props, slottable, commentAnchor);
            }
            else {
                throwTypeErrorForObject(input, type);
            }

            return anchor;
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

        if(previousSibling.nodeType === Node.COMMENT_NODE) {
            // TODO: how to guard for azoth comments only?
            clear(previousSibling);
        }

        previousSibling.remove();
    }

    anchor.data = 0;
}

/* complex types */

function composeArray(anchor, array, keepLast) {
    if(!keepLast) clear(anchor);
    // TODO: optimize arrays here if Node[]
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
    // TODO: use iterator and intercept system messages
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
        const json = JSON.stringify(obj, null, 2);
        message = `\n\nReceived as:\n\n${json}\n\n`;
    }
    catch(ex) {
        /* no-op */
    }
    throwTypeError(obj, 'object', message);
}
