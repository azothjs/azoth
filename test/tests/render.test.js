import Context from './Context';
import dom from './template/dom';
import text from './template/string';
import getBindingTree from './getBindingTree';
import render from './render';

const test = QUnit.test;
const module = QUnit.module;
const fixture = document.getElementById( 'qunit-fixture' );
const skip = { test: () => {} };

function renderToFixture( clonable, data ){
	const context = new Context( data );
	const bindingTree = getBindingTree( clonable.childNodes );
	const template = {
		clone() { return clonable.cloneNode( true ); },
		bindingTree
	}
	const rendered = render( template, context );
	fixture.appendChild( rendered );
}

module( 'dom render' );


var { $, Đ } = dom;

runTests( $, Đ );

function runTests( $, Đ ) {

	test( 'elements and text', t => {
		
		const t1 = Đ.text({ ref: 'foo' });
		const t2 = Đ.text({ ref: 'bar' });
		
		const fragment = $([
			$.el( 'div', [
				$.el( 'span', [ t1 ] ),
				$.el( 'span', [ $.text( 'label: ' ), t2 ] )
			])
		]);
		
		renderToFixture( fragment, { foo: 'foo', bar: 'bar' } );
		
		t.equal( fixture.innerHTML, '<div><span>foo</span><span>label: bar</span></div>' );
	});

	test( 'static section', t => {
		
		const t1 = Đ.text({ ref: 'foo' });
		
		const fragment = $([
			$.el( 'div', [ t1 ] )
		]);
		
		renderToFixture( fragment, { foo: 'foo' } );

		t.equal( fixture.innerHTML, '<div>foo</div>' );
	});

	test( '#for section', t => {
		
		const t1 = Đ.text({ ref: '.' });
		
		const fragment = $([
			Đ( { type: 'for', ref: 'items' }, {
				clonable: $( [ $.el( 'li', [ t1 ] ) ] )
			})
		]);
		
		renderToFixture( fragment, { items: [ 1, 2, 3 ] } );
		
		t.equal( fixture.innerHTML, '<li>1</li><li>2</li><li>3</li><!--for-->' );

	});

	(function () {
		
		const t1 = Đ.text({ ref: 'foo' });
		
		const fragment = $([
			Đ( { type: 'if', ref: 'condition' }, {
				clonable: $( [ $.el( 'li', [ t1 ] ) ] )
			})
		]);
		
		test( '#if section true', t => {
			renderToFixture( fragment, { condition: true, foo: 'foo' } );
			t.equal( fixture.innerHTML, '<li>foo</li><!--if-->');
		});

		
		test( '#if section false', t => {
			renderToFixture( fragment, { condition: false, foo: 'foo' } );
			t.equal( fixture.innerHTML, '<!--if-->');
		});
		
	})();

	(function () {
		
		const t1 = Đ.text({ ref: 'a' });
		const t2 = Đ.text({ ref: 'b' });
		
		const fragment = $([
			Đ( { type: 'with', ref: 'obj' }, {
				clonable: $( [ $.el( 'p', [ t1, t2 ] ) ] )
			})
		]);
		
		test( '#with section', t => {
			renderToFixture( fragment, { obj: { a: 'A', b: 'B' } } );
			t.equal( fixture.innerHTML, '<p>AB</p><!--with-->');
		});

		test( '#with section, no object', t => {
			renderToFixture( fragment, {} );
			t.equal( fixture.innerHTML, '<!--with-->');
		});

	})();

}


module( 'string render' );

function renderString( clonable, data ){
	const context = new Context( data );
	const bindingTree = getBindingTree( clonable );
	
	// clone method is string specific
	const template = {
		clone() { return clonable.slice(); },
		bindingTree
	};
	const html = render( template, context );
	return renderToString( html );
}

$ = text.$;
Đ = text.Đ;

function renderToString( tree ) {
	
	function flatten( tree ) {
		var node;
		for( var i = 0, l = tree.length; i < l; i++ ) {
			node = tree[i];
			
			if ( Array.isArray( node ) ) {
				flatten( node );
				tree[i] = node.join('');
			}
		}
		
		return tree.join('');
	}
	
	return flatten( tree );
	
}

test( 'elements and text', t => {
	
	const t1 = Đ.text({ ref: 'foo' });
	const t2 = Đ.text({ ref: 'bar' });

	const fragment = $([
		$.el( 'div', [
			$.el( 'span', [
				t1
			]),
			$.el( 'span', [
				$.text( 'label: ' ),
				t2
			])
		])
	]);
	
	const html = renderString( fragment, { foo: 'foo', bar: 'bar' } );
	
	t.equal( html, '<div><span>foo</span><span>label: bar</span></div>' );
});

test( '#for section', t => {
	
	const t1 = Đ.text({ ref: '.' });
	
	const fragment = $([
		Đ( { type: 'for', ref: 'items' }, {
			clonable: $( [ $.el( 'li', [ t1 ] ) ] )
		})
	]);
	
	const html = renderString( fragment, { items: [ 1, 2, 3 ] } );
	
	t.equal( html, '<li>1</li><li>2</li><li>3</li>' );

});