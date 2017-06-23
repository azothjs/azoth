(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(factory());
}(this, (function () { 'use strict';

function renderer(fragment) {
	init(fragment);
	return function render() {
		const clone = fragment.cloneNode(true);
		const nodes = clone.querySelectorAll('[data-bind]');
		nodes[nodes.length] = clone;
		return nodes;
	};
}
const replace = {
	'text-node': () => document.createTextNode(''),
	'block-node': () => document.createComment('block')
};
const query = Object.keys(replace).join();
function init(fragment) {
	const nodes = fragment.querySelectorAll(query);
	let node = null, newNode = null;
	for (var i = 0, l = nodes.length; i < l; i++) {
		node = nodes[i];
		newNode = replace[node.localName](node);
		node.parentNode.replaceChild(newNode, node);
	}
}

const div = document.createElement('div');
function makeFragment(html) {
	return toFragment(makeDiv(html).childNodes);
}
function toFragment(childNodes) {
	const fragment = document.createDocumentFragment();
	var node;
	while (node = childNodes[0]) {
		fragment.appendChild(node);
	}
	return fragment;
}
function makeDiv(html) {
	div.innerHTML = html;
	return div;
}

function __textBinder(index) {
	return node => {
		const text = node.childNodes[index];
		return val => text.nodeValue = val;
	};
}
function __blockBinder(index) {
	return node => {
		const anchor = node.childNodes[index];
		const insertBefore = node => anchor.parentNode.insertBefore(node, anchor);
		return val => {
			const fragment = typeof val === 'function' ? val() : val;
			Array.isArray(fragment) ? fragment.forEach(f => insertBefore(f, anchor)) : insertBefore(fragment, anchor);
		};
	};
}

const __render0 = renderer(makeFragment(`
        <li data-bind>Hello <text-node></text-node></li>
    `));
const __render1 = renderer(makeFragment(`
    <h1>Names</h1>
    <ul data-bind><block-node></block-node>
    </ul>
`));
const __bind0 = __textBinder(1);
const __bind1 = __blockBinder(0);
const names = [];
for (let i = 0; i < 1000; i++) {
	names.push(`Name${i}`);
}
console.time('render');
const template = names => (() => {
	const __nodes = __render1();
	__bind1(__nodes[0])(names.map(name => (() => {
		const __nodes = __render0();
		__bind0(__nodes[0])(name);
		return __nodes[__nodes.length];
	})()));
	return __nodes[__nodes.length];
})();
document.body.appendChild(template(names));
console.timeEnd('render');

})));
//# sourceMappingURL=bundle.js.map
