import Context from './Context';
import dom from './template/dom';
import text from './template/string';
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

	const count = 1500;
	const treshhold = 150;

runTests( dom, node => ( fixture.appendChild( node ), fixture.innerHTML ) );
// runTests( text, node => renderToString( node ) );

function runTests( engine, render ) {

	module( `${engine.type} performance` );

	const { $, Đ } = engine;

	function renderTemplate( templateData, data ){
		// console.time('template render')
		const template = engine.getTemplate( templateData.fragment, templateData.bindingTree );
		const context = new Context( data );
		const { queue, node } = template.render();
		// console.timeEnd('template render');
		// console.time('template bind')
		bind( queue, context );
		// console.timeEnd('template bind')
		return node;
	}
	
	test( `jsBlocks 12 column table with ${count} rows < ${treshhold}ms`, t => {
		
		const items = [];
		const columns = [ 'message', 'number', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth' ];
		
		for( var i = 0; i < count; i++ ) {        
			items[i] = {
				message: `message ${i}`,
				number: i,
				first: `first ${i}`,
				second: `second ${i}`,
				third: `third ${i}`,
				fourth: `fourth ${i}`,
				fifth: `fifth ${i}`,
				sixth: `sixth ${i}`,
				seventh: `seventh ${i}`,
				eighth: `eighth ${i}`,
				ninth: `ninth ${i}`,
				tenth: `tenth ${i}`,
			};
		}
		const start = performance.now();
		
		const bindings = columns.map( ref => Đ.text({ ref }) );
		const tds = bindings.map( b => $.el( 'td', [ b.node() ] ) );
		
		const s1 = Đ( { type: 'for', ref: 'items' }, {
			fragment: $([
				$.el( 'tr', tds ) 
			]),
			bindingTree: [{
				children: bindings.map( ( b, index ) => {
					return {
						index,
						children: [ { bindings: [ b ] } ]
					}; 
				})
			}]
		});
		
		const template = {
			fragment: $([
				$.el( 'table', [ s1.node() ])
			]),
			bindingTree: [{
				children: [{
					bindings: [ s1 ]
				}]
			}]
		};
		
		const rendered = renderTemplate( template, { items } );
		
		const result = render( rendered );
		
		const elapsed = performance.now() - start;
				
		t.ok( elapsed < treshhold, `render took ${elapsed}ms` );
		
		console.log( `${engine.type} render ${count} items: ${elapsed}ms` );
	});
	
	
	test( `mithril 150 simple items`, t => {
		
		const items = [{name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}];
		
		const start = performance.now();
		
		const t2 = Đ.text({ ref: 'name' });
		
		const s1 = Đ( { type: 'for', ref: 'items' }, {
			fragment: $([
				$.el( 'span', [ t2.node() ]) 
			]),
			bindingTree: [{
				children: [{
					bindings: [ t2 ]
				}]
			}]
		});
		
		const template = {
			fragment: $([ s1.node() ]),
			bindingTree: [{
				bindings: [ s1 ]
			}]
		};
		
		const rendered = renderTemplate( template, { items } );
		const result = render( rendered );
				
		const elapsed = performance.now() - start;
		
		t.ok( true, `render took ${elapsed}ms` );
		
		console.log( `${engine.type} mithril test render: ${elapsed}ms` );
		
	});
}
