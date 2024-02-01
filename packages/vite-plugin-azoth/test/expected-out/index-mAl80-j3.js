import { __compose } from 'azoth';

const templates = new Map();

function rendererById(id, isFragment = false) {
    if(templates.has(id)) return templates.get(id);

    // TODO: could fail on bad id...
    const templateEl = document.getElementById(id);
    return rendererFactory(id, templateEl.content, isFragment);

}

function rendererFactory(id, node, isFragment) {
    const template = renderer(node, isFragment);
    templates.set(id, template);
    return template;
}

function renderer(fragment, isFragment) {

    return function render() {
        const clone = fragment.cloneNode(true);
        const targets = clone.querySelectorAll('[data-bind]');
        const root = isFragment ? clone : clone.firstElementChild;

        return { root, targets };
    };
}

const t92280c0caa = rendererById('92280c0caa');

const t03038e2f88 = rendererById('03038e2f88');

const te208a2df9b = rendererById('e208a2df9b');

const t209e6208e8 = rendererById('209e6208e8');

const tf459a35a3a = rendererById('f459a35a3a', true);

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

function branch(promise, ...outlets) {
    const list = outlets.map(transform => {
        const { promise, resolve, reject } = Promise.withResolvers();
        return { promise, resolve, reject, transform };
    });

    dispatchAsync(promise, list);

    return list.map(({ promise }) => promise);
}

async function dispatchAsync(promise, list) {
    promise.then(data => {
        list.forEach(({ resolve, transform }) => {
            resolve(transform(data));
        });
    });
}

function InnerHtml({ html, className = "" }) {
  const rawEmoji = (() => {
    const { root: __root_92280c0caa, targets: __targets } = t92280c0caa();
    const __target0 = __targets[0];
    __target0.className = className ?? "";
    return __root_92280c0caa;
  })();
  rawEmoji.firstChild.innerHTML = html;
  return rawEmoji;
}
function EmojiList({ emojis }) {
  const { root: __root_03038e2f88, targets: __targets } = t03038e2f88();
  const __target0 = __targets[0];
  const __child0 = __target0.childNodes[1];
  __compose(emojis.map(Emoji), __child0);
  return __root_03038e2f88;
}
function Emoji({ name, unicode, htmlCode }) {
  const { root: __root_e208a2df9b, targets: __targets } = te208a2df9b();
  const __target0 = __targets[0];
  const __child0 = __target0.childNodes[1];
  const __child1 = __target0.childNodes[3];
  const __child2 = __target0.childNodes[5];
  __compose(InnerHtml({
    html: htmlCode.join("")
  }), __child0);
  __compose(name, __child1);
  __compose(unicode, __child2);
  return __root_e208a2df9b;
}
function EmojiCount({ count }) {
  const { root: __root_209e6208e8, targets: __targets } = t209e6208e8();
  const __target0 = __targets[0];
  const __child0 = __target0.childNodes[0];
  __compose(count, __child0);
  return __root_209e6208e8;
}
const [Count, List] = branch(fetchEmojis(), ({ length }) => EmojiCount({
  count: length
}), (emojis) => EmojiList({
  emojis
}));
const $App = (() => {
  const { root: __root_f459a35a3a, targets: __targets } = tf459a35a3a(true);
  const __target0 = __targets[0];
  const __target1 = __targets[1];
  const __child0 = __target0.childNodes[0];
  const __child1 = __target1.childNodes[3];
  __compose(Count, __child0);
  __compose(List, __child1);
  return __root_f459a35a3a;
})();
document.body.append($App);
