import Context from './Context';
import { $, Đ } from './template';
import getBindingTree from './getBindingTree';
import render from './render';

const test = QUnit.test;
const module = QUnit.module;
const fixture = document.getElementById( 'qunit-fixture' );
const skip = { test: () => {} };

module( 'II elements and text' );

test( 'render', t => {
	
	const t1 = Đ.text({ ref: 'foo' });
	const t2 = Đ.text({ ref: 'bar' });
	
	const fragment = $([
		$.el( 'div', [
			$.el( 'span', [ t1 ] ),
			$.el( 'span', [ $.text( 'label: ' ), t2 ] )
		])
	]);
	
	const bindingTree = getBindingTree( fragment.childNodes );
	
	const rendered = render( fragment, bindingTree, new Context({ foo: 'foo', bar: 'bar'}) );
	fixture.appendChild( rendered );
	t.equal( fixture.innerHTML, '<div><span>foo</span><span>label: bar</span></div>' );
});