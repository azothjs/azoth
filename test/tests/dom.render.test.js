import Context from './Context';
import dom from './template/dom';
import text from './template/string';
import getBindingTree from './getBindingTree';
import bind from './bind';

const test = QUnit.test;
const module = QUnit.module;
const fixture = document.getElementById( 'qunit-fixture' );
const skip = { test: () => {} };

module( 'dom render' );

const { $, Đ } = dom;

function renderTemplate( fragment, data ){
	const template = dom.getTemplate( fragment );
	const context = new Context( data );
	const { queue, node } = template.render();
	bind( queue, context );
	return node;
}

test( 'elements and text', t => {
	
	const t1 = Đ.text({ ref: 'foo' });
	const t2 = Đ.text({ ref: 'bar' });
	
	const fragment = $([
		$.el( 'div', [
			$.el( 'span', [ t1 ] ),
			$.el( 'span', [ $.text( 'label: ' ), t2 ] )
		])
	]);
	
	var template = renderTemplate( fragment, { foo: 'foo', bar: 'bar' } );
	fixture.appendChild( template );
	t.equal( fixture.innerHTML, '<div><span>foo</span><span>label: bar</span></div>' );
});

test( 'static section', t => {
	
	const t1 = Đ.text({ ref: 'foo' });
	
	const fragment = $([
		$.el( 'div', [ t1 ] )
	]);
	
	var template = renderTemplate( fragment, { foo: 'foo' } );
	fixture.appendChild( template );
	t.equal( fixture.innerHTML, '<div>foo</div>' );
});

test( '#for section', t => {
	
	const t1 = Đ.text({ ref: '.' });
	
	const fragment = $([
		Đ( { type: 'for', ref: 'items' }, {
			fragment: $( [ $.el( 'li', [ t1 ] ) ] )
		})
	]);
	
	var template = renderTemplate( fragment, { items: [ 1, 2, 3 ] } );
	fixture.appendChild( template );
	t.equal( fixture.innerHTML, '<li>1</li><li>2</li><li>3</li><!--for-->' );

});

(function () {
	
	const t1 = Đ.text({ ref: 'foo' });
	
	const fragment = $([
		Đ( { type: 'if', ref: 'condition' }, {
			fragment: $( [ $.el( 'li', [ t1 ] ) ] )
		})
	]);
		
	test( '#if section true', t => {
		var template = renderTemplate( fragment, { condition: true, foo: 'foo' } );
		fixture.appendChild( template );
		t.equal( fixture.innerHTML, '<li>foo</li><!--if-->' );
	});

	
	test( '#if section false', t => {
		var template = renderTemplate( fragment, { condition: false, foo: 'foo' } );
		fixture.appendChild( template );
		t.equal( fixture.innerHTML, '<!--if-->' );
	});
	
})();

(function () {
	
	const t1 = Đ.text({ ref: 'a' });
	const t2 = Đ.text({ ref: 'b' });
	
	const fragment = $([
		Đ( { type: 'with', ref: 'obj' }, {
			fragment: $( [ $.el( 'p', [ t1, t2 ] ) ] )
		})
	]);
		
	test( '#with section', t => {
		var template = renderTemplate( fragment, { obj: { a: 'A', b: 'B' } } );
		fixture.appendChild( template );
		t.equal( fixture.innerHTML, '<p>AB</p><!--with-->' );
	});

	test( '#with section, no object', t => {
		var template = renderTemplate( fragment, {} );
		fixture.appendChild( template );
		t.equal( fixture.innerHTML, '<!--with-->' );
	});

})();