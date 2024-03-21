/* compose, composeElement, create, createElement */
const IGNORE = Symbol.for('azoth.compose.IGNORE');

function compose(anchor, input, keepLast, props, slottable) {
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

function createElement(Constructor, props, slottable, topLevel = false) {
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
            else {
                throwTypeErrorForObject(input);
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

const QUERY_SELECTOR = '[data-bind]';
const DOMRenderer = {
    name: 'DOMRenderer',

    createTemplate(id, content, isFragment) {
        const node = DOMRenderer.template(id, content);
        const render = DOMRenderer.renderer(node, isFragment);
        return render;
    },

    template(id, content) {
        if(content) return DOMRenderer.create(content);
        DOMRenderer.getById(id);
    },

    create(html) {
        const template = document.createElement('template');
        template.innerHTML = html;
        return template.content;
    },
    getById(id) {
        const template = document.getElementById(id);
        if(!template) {
            throw new Error(`No template with id "${id}"`);
        }
        return template.content;
    },

    renderer(fragment, isFragment) {
        if(!isFragment) fragment = fragment.firstElementChild;
        // TODO: malformed fragment check...necessary?

        return function render() {
            const clone = fragment.cloneNode(true);
            const targets = clone.querySelectorAll(QUERY_SELECTOR);
            return [clone, targets];
        };
    },
    bound(dom) {
        return dom.querySelectorAll(QUERY_SELECTOR);
    }
};

const templates = new Map(); // cache
let renderEngine = DOMRenderer; // DOM or HTML engine

function get(id, isFragment = false, content) {
    if(templates.has(id)) return templates.get(id);

    const template = renderEngine.createTemplate(id, content, isFragment);

    templates.set(id, template);
    return template;
}

const bindings = new Map(); // cache

// stack
const injectable = [];

const templateRenderer = getBound => (...args) => {
    const [root, bind] = getBound();
    if(bind) bind(...args);
    return root;
};

function renderer(id, targets, makeBind, isFragment, content) {
    const create = get(id, isFragment, content);

    function getBound() {
        let bind = null;
        let boundEls = null;
        let node = injectable.at(-1); // peek!

        // TODO: test injectable is right template id type

        if(node) {
            const hasBind = bindings.has(node);
            bind = bindings.get(node);
            if(hasBind) return [node, bind];
        }

        // Honestly not sure this really needed, 
        // use case would be list component optimize by
        // not keeping bind functions?
        // overhead is small as it is simple function
        if(node) boundEls = renderEngine.bound(node);
        else {
            // (destructuring re-assignment)
            ([node, boundEls] = create());
        }

        const nodes = targets ? targets(node, boundEls) : null;
        bind = makeBind ? makeBind(nodes) : null;

        bindings.set(node, bind);
        return [node, bind];
    }

    return templateRenderer(getBound);
}

const gac282a7be0 = (r,t) => [t[0].childNodes[3]];

const bd41d8cd98f = (ts) => {
  const t0 = ts[0];
  return (v0) => {
    compose(t0, v0);
  };    
};

const g3558193cd9 = (r) => [r.childNodes[1]];

const g2cc7b6176d = (r,t) => [t[0],r.childNodes[3],r.childNodes[5]];

const bb3ae510d64 = (ts) => {
  const t0 = ts[0], t1 = ts[1], t2 = ts[2];
  return (v0, v1, v2) => {
    t0.innerHTML = v0;
    compose(t1, v1);
    compose(t2, v2);
  };    
};

const tf30ef00ee2 = renderer("f30ef00ee2", gac282a7be0, bd41d8cd98f, true);
const te23131e855 = renderer("e23131e855", g3558193cd9, bd41d8cd98f, false);
const t0f61ee8206 = renderer("0f61ee8206", g2cc7b6176d, bb3ae510d64, false);

async function fetchEmojis() {
    const res = await fetch('https://emojihub.yurace.pro/api/all');
    return await res.json();
}

const List = fetchEmojis().then(emojis => EmojiList({
  emojis
}));
const App = tf30ef00ee2(createElement(List));
document.body.append(App);
function EmojiList({emojis}) {
  return te23131e855(emojis.map(Emoji));
}
function Emoji({name, unicode, htmlCode}) {
  return t0f61ee8206(htmlCode.join(''),name,unicode);
}
