/* compose, composeElement, create, createElement */

export function compose(anchor, input, keepLast = false) {
    const type = typeof input;
    switch(true) {
        case input === undefined:
        case input === null:
        case input === true:
        case input === false:
        case input === '':
            if(!keepLast) clear(anchor);
            break;
        case type === 'number':
            input = `${input}`;
        // eslint-disable-next-line no-fallthrough
        case type === 'string':
        case input instanceof Node:
            replace(anchor, input, keepLast);
            break;
        case type === 'function':
            compose(anchor, input(), keepLast);
            break;
        case input instanceof Promise:
            input.then(value => compose(anchor, value, keepLast));
            break;
        case Array.isArray(input):
            if(!keepLast) clear(anchor);
            composeArray(anchor, input, keepLast);
            break;
        case type === 'object': {
            composeObject(anchor, input, keepLast);
            break;
        }
        default: {
            throwTypeError(input, type);
        }
    }
}

export function composeElement(anchor, Constructor, props, slottable) {
    const dom = create(Constructor, props, slottable);
    compose(anchor, dom);
}

// main create recursive cascade function
function create(input, props, slottable) {
    const type = typeof input;
    switch(true) {
        case input instanceof Node:
        case type === 'string':
            return input;
        case type === 'number':
            return `${input}`;
        case input === undefined:
        case input === null:
        case input === true:
        case input === false:
        case input === '':
            return null;
        case !!input.prototype?.constructor:
            // eslint-disable-next-line new-cap
            return create(new input(props, slottable));
        case type === 'function':
            return create(input(props, slottable));
        case type === 'object' && input.render && typeof input.render === 'function':
            return create(input.render(props, slottable));
        case input instanceof Promise: {
            const anchor = document.createComment('0');
            input.then(value => {
                if(props) Object.assign(value, props);
                if(slottable) value.slottable = slottable;
                compose(anchor, value);
            });
            return anchor;
        }
        case Array.isArray(input): {
            const anchor = document.createComment('0');
            compose(anchor, input);
            return anchor;
        }
        case type === 'object': {
            const anchor = document.createComment('0');
            composeObject(anchor, input);
            return anchor;
        }
        default: {
            throwTypeError(input, type);
        }
    }
}

// createElement wraps create() changing 
// string or num result into TextNode
export function createElement(Constructor, props, slottable) {
    const result = create(Constructor, props, slottable);
    const type = typeof result;
    if(type === 'string' || type === 'number') {
        return document.createTextNode(result);
    }
    return result;
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

    while(count--) {
        const { previousSibling } = node;
        if(!previousSibling) break;

        if(previousSibling.nodeType === Node.COMMENT_NODE) {
            // TODO: how to guard for azoth comments only?
            clear(previousSibling);
        }

        clear(previousSibling);
        previousSibling.remove();
    }

    anchor.data = 0;
}


/* complex types */

function composeArray(anchor, array) {
    // TODO: optimize arrays here if Node[]
    for(let i = 0; i < array.length; i++) {
        compose(anchor, array[i], true);
    }
}

function composeObject(anchor, object, keepLast) {
    // TODO: distribute below:
    // if(!keepLast) clear(anchor);

    switch(true) {
        case object instanceof ReadableStream:
            composeStream(anchor, object, true);
            break;
        // w/o the !! this causes intermittent failures :p
        // maybe vitest/node thing?
        case !!object[Symbol.asyncIterator]:
            composeAsyncIterator(anchor, object, keepLast);
            break;
        case !!object.render:
            compose(anchor, object.render(), keepLast);
            break;
        // TODO:
        case !!object.subscribe:
        case !!object.on:
        default: {
            throwTypeErrorForObject(object);
        }
    }
}

async function composeStream(anchor, stream, keepLast) {
    stream.pipeTo(new WritableStream({
        write(chunk) {
            compose(anchor, chunk, keepLast);
        }
    }));
}

async function composeAsyncIterator(anchor, iterator, keepLast) {
    // TODO: use iterator and intercept system messages
    for await(const value of iterator) {
        compose(anchor, value, keepLast);
    }
}


/* thrown errors */

function throwTypeError(input, type, footer = '') {
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

