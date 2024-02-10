function compose(input, anchor, keepLast = false) {
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
            composeArray(input, anchor);
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
        // w/o the !! this cause intermittent failures
        case !!object[Symbol.asyncIterator]:
            composeAsyncIterator(object, anchor, keepLast);
            break;
        case object.subscribe:
        case object.on:
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

function removePrior(anchor) {
    const count = +anchor.data;
    if(!count) return;
    if(tryRemovePrior(anchor)) anchor.data = `${count - 1}`;
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

// TODO: array in array with replace param
function composeArray(array, anchor) {
    for(let i = 0; i < array.length; i++) {
        compose(array[i], anchor, true);
    }
}

function throwTypeError(input, type, footer = '') {
    throw new TypeError(`\
Invalid {...} compose input type "${type}", \
value ${input}.${footer}`
    );
}

// need to walk additional comments
function tryRemovePrior({ previousSibling }) {
    if(!previousSibling) return false;
    if(previousSibling.nodeType !== 3 /* comment */) {
        // TODO: id azoth comments only!
        removePrior(previousSibling);
    }
    previousSibling.remove();
    return true;
}

const templates = new Map();

function rendererById(id, isFragment = false) {
    if(templates.has(id)) return templates.get(id);

    // TODO: could fail on bad id...
    const templateEl = document.getElementById(id);
    return rendererFactory(id, templateEl.content, isFragment);

}

function rendererFactory(id, node, isFragment) {
    const render = renderer(node, isFragment);
    templates.set(id, render);
    return render;
}

function renderer(fragment, isFragment) {

    return function render() {
        const clone = fragment.cloneNode(true);
        const targets = clone.querySelectorAll('[data-bind]');
        const root = isFragment ? clone : clone.firstElementChild;

        return [root, targets];
    };
}

const t61b16566ed = rendererById('61b16566ed', true);

const t03038e2f88 = rendererById('03038e2f88');

const t68bf46eb1d = rendererById('68bf46eb1d');

const t92280c0caa = rendererById('92280c0caa');

const EMOJIS = 'EMOJIS';
async function fetchEmojis() {
    const json = localStorage.getItem(EMOJIS);
    if(json) {
        try {
            return JSON.parse(json);
        }
        catch(ex) {
            // failed parse
            localStorage.removeItem(EMOJIS);
        }
    }
    // await sleep(3000);
    const res = await fetch('https://emojihub.yurace.pro/api/all');
    const emojis = await res.json();

    localStorage.setItem(EMOJIS, JSON.stringify(emojis, true, 4));

    return emojis;
}

const List = fetchEmojis().then((emojis) => EmojiList({
  emojis
}));
const App = (() => {
  const [__root_61b16566ed, __targets] = t61b16566ed(true);
  const __target0 = __targets[0];
  const __child0 = __target0.childNodes[3];
  compose(List, __child0);
  return __root_61b16566ed;
})();
document.body.append(App);
function EmojiList({ emojis }) {
  const [__root_03038e2f88, __targets] = t03038e2f88();
  const __target0 = __targets[0];
  const __child0 = __target0.childNodes[1];
  compose(emojis.map(Emoji), __child0);
  return __root_03038e2f88;
}
function Emoji({ name, unicode, htmlCode }) {
  const [__root_68bf46eb1d, __targets] = t68bf46eb1d();
  const __target0 = __targets[0];
  const __child0 = __target0.childNodes[1];
  const __child1 = __target0.childNodes[3];
  const __child2 = __target0.childNodes[5];
  compose(InnerHtml({
    html: htmlCode.join("")
  }), __child0);
  compose(name, __child1);
  compose(unicode, __child2);
  return __root_68bf46eb1d;
}
function InnerHtml({ html, className = "" }) {
  const rawEmoji = (() => {
    const [__root_92280c0caa, __targets] = t92280c0caa();
    const __target0 = __targets[0];
    __target0.className = className ?? "";
    return __root_92280c0caa;
  })();
  rawEmoji.firstChild.innerHTML = html;
  return rawEmoji;
}
