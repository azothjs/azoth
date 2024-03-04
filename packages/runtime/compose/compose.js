/* exported compose entry points */

export function compose(anchor, input, keepLast = false) {
    const type = typeof input;
    switch(true) {
        case input === undefined:
        case input === null:
        case input === true:
        case input === false:
        case input === '':
            if(!keepLast) removePrior(anchor);
            break;
        case type === 'string':
        case type === 'number':
        case input instanceof Node:
            insert(anchor, input, keepLast);
            break;
        case type === 'function':
            compose(anchor, input(), keepLast);
            break;
        case input instanceof Promise:
            input.then(value => compose(anchor, value, keepLast));
            break;
        case Array.isArray(input):
            if(!keepLast) removePrior(anchor);
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

export function createElement(Constructor, props, slottable) {
    const result = create(Constructor, props, slottable);
    const type = typeof result;
    if(type === 'string' || type === 'number') {
        return document.createTextNode(result);
    }
    return result;
}

// + create main recursive function
function create(input, props, slottable) {
    const type = typeof input;
    switch(true) {
        case input instanceof Node:
        case type === 'string':
        case type === 'number':
            return input;
        case input === undefined:
        case input === null:
        case input === true:
        case input === false:
        case input === '':
            return null;
        case !!input.prototype?.constructor:
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
            compose(anchor, input);
            return anchor;
        }
        default: {
            throwTypeError(input, type);
        }
    }
}

/* insert and remove */

function insert(anchor, input, keepLast) {
    if(!keepLast) removePrior(anchor);

    // happy-dom bug
    const type = typeof input;
    const isDomNode = input instanceof Node;
    if(type !== 'string' && !isDomNode) {
        input = `${input}`;
    }

    anchor.before(input);
    anchor.data = ++anchor.data;
}

function removePrior(anchor) {
    let node = anchor;
    let count = +anchor.data;

    while(count--) {
        const { previousSibling } = node;
        if(!previousSibling) break;

        if(previousSibling.nodeType === Node.COMMENT_NODE) {
            // TODO: how to guard for azoth comments only?
            removePrior(previousSibling);
        }

        removePrior(previousSibling);
        previousSibling.remove();
    }

    anchor.data = 0;
}

/* cascade functions */

function composeObject(anchor, object, keepLast) {
    // TODO: distribute below:
    // if(!keepLast) removePrior(anchor);

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

function composeArray(anchor, array) {
    // TODO: optimize arrays here if Node[]
    for(let i = 0; i < array.length; i++) {
        compose(anchor, array[i], true);
    }
}

async function composeStream(anchor, stream, keepLast) {
    const writeable = new WritableStream({
        write(chunk) {
            compose(anchor, chunk, keepLast);
        }
    });
    stream.pipeTo(writeable);
}

async function composeAsyncIterator(anchor, iterator, keepLast) {
    // TODO: use iterator and intercept
    for await(const value of iterator) {
        compose(anchor, value, keepLast);
    }
}

/* throw errors */

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

function throwTypeError(input, type, footer = '') {
    throw new TypeError(`\
Invalid {...} compose input type "${type}", \
value ${input}.${footer}`
    );
}
