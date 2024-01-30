import { __compose } from "azoth";
const templates = /* @__PURE__ */ new Map();
function makeRenderer(id, html, isFragment = false) {
  if (templates.has(id))
    return templates.get(id);
  const template = document.createElement("template");
  template.innerHTML = html;
  return rendererFactory(id, template.content, isFragment);
}
function rendererFactory(id, node, isFragment) {
  const template = renderer(node, isFragment);
  templates.set(id, template);
  return template;
}
function renderer(fragment, isFragment) {
  return function render() {
    const clone = fragment.cloneNode(true);
    const targets = clone.querySelectorAll("[data-bind]");
    const root = isFragment ? clone : clone.firstElementChild;
    return { root, targets };
  };
}
const t92280c0caa = makeRenderer("92280c0caa", `<span data-bind></span>`);
const t03038e2f88 = makeRenderer("03038e2f88", `<ul data-bind>
        <!--0-->
    </ul>`);
const te208a2df9b = makeRenderer("e208a2df9b", `<li data-bind>
        <!--0--> 
        <!--0-->
        <!--0--> 
    </li>`);
const t209e6208e8 = makeRenderer("209e6208e8", `<span data-bind><!--0--></span>`);
const te323ac00ac = makeRenderer("e323ac00ac", `<div>
    <header>
        <h1 data-bind><!--0--> emojis for all my friends</h1>
    </header>
        
    <main data-bind>
        <h2>Amazing Emoji List</h2>
        <!--0-->
    </main>

</div>`);
const EMOJIS = "EMOJIS";
async function fetchEmojis() {
  const json = localStorage.getItem(EMOJIS);
  if (json) {
    try {
      return JSON.parse(json);
    } catch (ex) {
      localStorage.removeItem(EMOJIS);
    }
  }
  const res = await fetch("https://emojihub.yurace.pro/api/all");
  const emojis = await res.json();
  localStorage.setItem(EMOJIS, JSON.stringify(emojis, true, 4));
  return emojis;
}
function branch(promise, ...outlets) {
  const list = outlets.map((transform) => {
    const { promise: promise2, resolve, reject } = Promise.withResolvers();
    return { promise: promise2, resolve, reject, transform };
  });
  dispatchAsync(promise, list);
  return list.map(({ promise: promise2 }) => promise2);
}
async function dispatchAsync(promise, list) {
  promise.then((data) => {
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
  const { root: __root_e323ac00ac, targets: __targets } = te323ac00ac();
  const __target0 = __targets[0];
  const __target1 = __targets[1];
  const __child0 = __target0.childNodes[0];
  const __child1 = __target1.childNodes[3];
  __compose(Count, __child0);
  __compose(List, __child1);
  return __root_e323ac00ac;
})();
document.body.append($App);
