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
            inject(anchor, input, keepLast);
            break;
        case type === 'function':
            compose(anchor, input(), keepLast);
            break;
        case input instanceof Promise:
            input.then(value => compose(anchor, value, keepLast));
            break;
        case Array.isArray(input):
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

function composeObject(anchor, object, keepLast) {
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

async function composeAsyncIterator(anchor, iterator, keepLast) {
    // TODO: use iterator and intercept
    for await(const value of iterator) {
        compose(anchor, value, keepLast);
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

export function composeElement(anchor, Constructor, props, slottable) {
    const dom = createConstructed(Constructor, props, slottable);
    compose(anchor, dom);
}

function composeArray(anchor, array) {
    // TODO: optimize arrays here if Node[]
    for(let i = 0; i < array.length; i++) {
        compose(anchor, array[i], true);
    }
}

function inject(anchor, input, keepLast) {
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

function throwTypeError(input, type, footer = '') {
    throw new TypeError(`\
Invalid {...} compose input type "${type}", \
value ${input}.${footer}`
    );
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
            compose(anchor, input);
            return anchor;
        }
        default: {
            throwTypeError(input, type);
        }
    }
}

export function createElement(Constructor, props, slottable) {
    const result = createConstructed(Constructor, props, slottable);
    const type = typeof result;
    if(type === 'string' || type === 'number') {
        return document.createTextNode(result);
    }
    return result;
}

function createConstructed(Constructor, props, slottable) {
    if(Constructor.prototype?.constructor) {
        return create(new Constructor(props, slottable));
    }
    if(typeof Constructor === 'function') {
        return create(Constructor(props, slottable));
    }
    // if(!!Constructor[Symbol.asyncIterator]) {
    //     return create(Constructor(props))
    // }
    if(Constructor instanceof Promise) {
        const anchor = document.createComment('0');
        Constructor.then(input => {
            if(props) Object.assign(input, props);
            if(slottable) input.slottable = slottable;
            compose(anchor, input);
        });
        return anchor;
    }
    throw new Error(`Unexpected Component type ${Constructor}`);
}
