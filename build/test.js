(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(factory());
}(this, (function () { 'use strict';

const test = QUnit.test;
const module$1 = QUnit.module;

const fixture = document.getElementById('qunit-fixture');
const clean$1 = html => html.replace(/ data-bind=""/g, '').replace(/<!--block-->/g, '').replace(/<!--block start-->/g, '');
fixture.cleanHTML = function cleanHtml() {
	return clean$1(this.innerHTML);
};

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

const __render0 = renderer(makeFragment(`<span data-bind>Hello <text-node></text-node>!</span>`));
const __render1 = renderer(makeFragment(`<text-node></text-node> + <text-node></text-node> = <text-node></text-node>`));
const __render2 = renderer(makeFragment(`<text-node></text-node>`));
const __render3 = renderer(makeFragment(`<span>foo</span>`));
const __render4 = renderer(makeFragment(`<div data-bind><text-node></text-node></div>`));
const __render5 = renderer(makeFragment(`<span>Yes</span>`));
const __render6 = renderer(makeFragment(`<span>No</span>`));
const __render7 = renderer(makeFragment(`<block-node></block-node>`));
const __render8 = renderer(makeFragment(`
					<li data-bind><text-node></text-node></li>	
				`));
const __render9 = renderer(makeFragment(`
			<ul data-bind>
				<block-node></block-node>
			</ul>
		`));
const __render10 = renderer(makeFragment(`
			<ul>
					<li>balloon</li>
					<li>hammer</li>
					<li>lipstick</li>
			</ul>
		`));
const __bind0 = __textBinder(1);
const __bind1 = __textBinder(0);
const __bind2 = __textBinder(2);
const __bind3 = __textBinder(4);
const __bind4 = __blockBinder(0);
const __bind5 = __blockBinder(1);
const clean = html$$1 => html$$1.replace(/ data-bind=""/g, '').replace(/<!--block-->/g, '').replace(/<!--block start-->/g, '');
fixture.cleanHTML = function cleanHtml() {
	return clean(this.innerHTML);
};
module$1('static rendering', () => {
	test('hello diamond', t => {
		const template = name => (() => {
			const __nodes = __render0();
			__bind0(__nodes[0])(name);
			return __nodes[__nodes.length];
		})();
		const fragment = template('Diamond');
		t.notOk(fragment.unsubscribe);
		fixture.appendChild(fragment);
		t.equal(fixture.cleanHTML(), '<span>Hello Diamond!</span>');
	});
	test('expression', t => {
		const template = (x, y) => (() => {
			const __nodes = __render1();
			__bind1(__nodes[0])(x);
			__bind2(__nodes[0])(y);
			__bind3(__nodes[0])(x + y);
			return __nodes[__nodes.length];
		})();
		const fragment1 = template(5, 2);
		fixture.appendChild(fragment1);
		t.equal(fixture.cleanHTML(), '5 + 2 = 7');
	});
	test('external variables', t => {
		const upper = s => s.toUpperCase();
		const template = x => (() => {
			const __nodes = __render2();
			__bind1(__nodes[0])(upper(x));
			return __nodes[__nodes.length];
		})();
		const fragment = template('foo');
		fixture.appendChild(fragment);
		t.equal(fixture.cleanHTML(), 'FOO');
	});
	test('block', t => {
		const template = () => (() => {
			const __nodes = __render4();
			__bind1(__nodes[0])((() => {
				const __nodes = __render3();
				return __nodes[__nodes.length];
			})());
			return __nodes[__nodes.length];
		})();
		const fragment = template();
		fixture.appendChild(fragment);
		t.equal(fixture.cleanHTML(), '<div><span>foo</span></div>');
	});
	test('conditional block with variables', t => {
		const yes = (() => {
			const __nodes = __render5();
			return __nodes[__nodes.length];
		})();
		const no = (() => {
			const __nodes = __render6();
			return __nodes[__nodes.length];
		})();
		const template = choice => (() => {
			const __nodes = __render7();
			__bind4(__nodes[0])(choice ? yes : no);
			return __nodes[__nodes.length];
		})();
		const fragment = template(true);
		t.equal(fixture.cleanHTML(), '<span>No</span>');
	});
	test('block with array', t => {
		const template = items => (() => {
			const __nodes = __render9();
			__bind5(__nodes[0])(items.map(({name}) => (() => {
				const __nodes = __render8();
				__bind1(__nodes[0])(name);
				return __nodes[__nodes.length];
			})()));
			return __nodes[__nodes.length];
		})();
		const items = [{
			name: 'balloon'
		}, {
			name: 'hammer'
		}, {
			name: 'lipstick'
		}];
		const fragment = template(items);
		fixture.appendChild(fragment);
		t.equal(fixture.cleanHTML(), (() => {
			const __nodes = __render10();
			return __nodes[__nodes.length];
		})());
	});
});

})));
