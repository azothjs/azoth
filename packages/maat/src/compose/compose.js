export function compose(input, anchor, keepLast = false) {
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
        case input instanceof Node: {
            inject(input, anchor, keepLast);
            break;
        }
        case type === 'function':
            compose(input(), anchor, keepLast);
            break;
        case input instanceof Promise:
            input.then(v => compose(v, anchor, keepLast));
            break;
        case Array.isArray(input):
            composeArray(input, anchor, keepLast);
            break;
        case type === 'object': {
            composeObject(input, anchor, keepLast);
            break;
        }
        default: {
            throwTypeError(input, type);
        }
    }
}

function composeObject(object, anchor, keepLast) {
    switch(true) {
        case object instanceof ReadableStream:
            composeStream(object, anchor, true);
            break;
        // w/o the !! this causes intermittent failures
        case !!object[Symbol.asyncIterator]:
            composeAsyncIterator(object, anchor, keepLast);
            break;
        case !!object.render:
            compose(object.render(), anchor, keepLast);
            break;
        // TODO:
        case !!object.subscribe:
        case !!object.on:
        default: {
            throwTypeErrorForObject(object);
        }
    }
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

async function composeAsyncIterator(iterator, anchor, keepLast) {
    // TODO: use iterator and intercept
    for await(const value of iterator) {
        compose(value, anchor, keepLast);
    }
}

async function composeStream(stream, anchor, keepLast) {
    const writeable = new WritableStream({
        write(chunk) {
            compose(chunk, anchor, keepLast);
        }
    });
    stream.pipeTo(writeable);
}

export function composeElement(Constructor, anchor, props) {
    const dom = doCreateElement(Constructor, props);
    compose(dom, anchor);
}

// TODO: TEST array in array with replace param
function composeArray(array, anchor) {
    // TODO: optimize arrays here if Node[]
    for(let i = 0; i < array.length; i++) {
        compose(array[i], anchor, true);
    }
}

function removePrior(anchor) {
    const count = +anchor.data;
    if(!count) return;
    if(tryRemovePrior(anchor)) anchor.data = `${count - 1}`;
}

// need to walk additional comments
function tryRemovePrior({ previousSibling }) {
    if(!previousSibling) return false;
    // TODO: isn't type 8?
    if(previousSibling.nodeType !== 3 /* comment */) {
        // TODO: id azoth comments only!
        removePrior(previousSibling);
    }
    previousSibling.remove();
    return true;
}

function inject(input, anchor, keepLast) {
    let count = +anchor.data;
    if(!keepLast && count > 0 && tryRemovePrior(anchor)) count--;

    // happy-dom bug
    const type = typeof input;
    const isDomNode = input instanceof Node;
    if(type !== 'string' && !isDomNode) {
        input = `${input}`;
    }

    anchor.before(input);
    anchor.data = `${count + 1}`;
}

function throwTypeError(input, type, footer = '') {
    throw new TypeError(`\
Invalid {...} compose input type "${type}", \
value ${input}.${footer}`
    );
}

export function createElement(Constructor, props) {
    const result = doCreateElement(Constructor, props);
    const type = typeof result;
    if(type === 'string' || type === 'number') {
        return document.createTextNode(result);
    }
    return result;
}

function doCreateElement(Constructor, props) {
    if(Constructor.prototype?.constructor) {
        return create(new Constructor(props));
    }
    if(typeof Constructor === 'function') {
        return create(Constructor(props));
    }
    throw new Error(`Unexpected Component type ${Constructor}`);
}

function create(input) {
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
        case type === 'function':
            return create(input());
        case type === 'object' && input.render && typeof input.render === 'function':
            return create(input.render());
        case Array.isArray(input):
        case input instanceof Promise:
        case type === 'object': {
            const anchor = document.createComment('0');
            compose(input, anchor);
            return anchor;
        }
        default: {
            throwTypeError(input, type);
        }
    }
}
