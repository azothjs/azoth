import Context from './Context';
import dom from './template/dom';
import text from './template/string';
import getBindingTree from './getBindingTree';
import bind from './bind';

const test = QUnit.test;
const module = QUnit.module;
const fixture = document.getElementById( 'qunit-fixture' );
const skip = { test: () => {} };


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

// runTests( dom, node => ( fixture.appendChild( node ), fixture.innerHTML ), true );
// runTests( text, node => renderToString( node ) );

function runTests( engine, render, includeSectionComment = false ) {
	
	module( `${engine.type} render` );
	
	const { $, Đ } = engine;

	function renderTemplate( fragment, data ){
		const template = engine.getTemplate( fragment );
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
		var result = render( template );
		
		t.equal( result, '<div><span>foo</span><span>label: bar</span></div>' );
	});

	test( 'static section', t => {
		
		const t1 = Đ.text({ ref: 'foo' });
		
		const fragment = $([
			$.el( 'div', [ t1 ] )
		]);
		
		var template = renderTemplate( fragment, { foo: 'foo' } );
		var result = render( template );

		t.equal( result, '<div>foo</div>' );
	});

	test( '#for section', t => {
		
		const t1 = Đ.text({ ref: '.' });
		
		const fragment = $([
			Đ( { type: 'for', ref: 'items' }, {
				fragment: $( [ $.el( 'li', [ t1 ] ) ] )
			})
		]);
		
		var template = renderTemplate( fragment, { items: [ 1, 2, 3 ] } );
		var result = render( template );
		
		const suffix = includeSectionComment ? '<!--for-->' : '' 
		t.equal( result, '<li>1</li><li>2</li><li>3</li>' + suffix );

	});

	(function () {
		
		const t1 = Đ.text({ ref: 'foo' });
		
		const fragment = $([
			Đ( { type: 'if', ref: 'condition' }, {
				fragment: $( [ $.el( 'li', [ t1 ] ) ] )
			})
		]);
		
		const suffix = includeSectionComment ? '<!--if-->' : '' 
		
		test( '#if section true', t => {
			var template = renderTemplate( fragment, { condition: true, foo: 'foo' } );
			var result = render( template );
			t.equal( result, '<li>foo</li>' + suffix);
		});

		
		test( '#if section false', t => {
			var template = renderTemplate( fragment, { condition: false, foo: 'foo' } );
			var result = render( template );
			t.equal( result, suffix);
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
		
		const suffix = includeSectionComment ? '<!--with-->' : '' 
		
		test( '#with section', t => {
			var template = renderTemplate( fragment, { obj: { a: 'A', b: 'B' } } );
			var result = render( template );
			t.equal( result, '<p>AB</p>' + suffix);
		});

		test( '#with section, no object', t => {
			var template = renderTemplate( fragment, {} );
			var result = render( template );
			t.equal( result, suffix);
		});

	})();

}