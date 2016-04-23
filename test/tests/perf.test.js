import Diamond from './diamond';

const test = QUnit.test;
const module = QUnit.module;
const fixture = document.getElementById( 'qunit-fixture' );
const skip = { test: () => {} };

module( `dom performance` );

const { $tatic, bound } = Diamond.dom;

const count = 1500;
const treshhold = 150;

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
	
	const bindings = columns.map( ref => bound.text({ ref }) );
	const tds = bindings.map( b => $tatic.el( 'td', null, [ b.node() ] ) );
	
	const s1 = bound( { type: 'for', ref: 'items' }, {
		fragment: $tatic([
			$tatic.el( 'tr', null, tds ) 
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
		fragment: $tatic([
			$tatic.el( 'table', null, [ s1.node() ])
		]),
		bindingTree: [{
			children: [{
				bindings: [ s1 ]
			}]
		}]
	};
	
	new Diamond( { 
		template, 
		data: { items }, 
		el: fixture 
	});
	
	const elapsed = performance.now() - start;
			
	t.ok( elapsed < treshhold, `render took ${elapsed}ms` );
	console.log( `dom render ${count} items: ${elapsed}ms` );
});


test( `mithril 150 simple items`, t => {
	
	const items = [{name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}];
	
	const start = performance.now();
	
	const t2 = bound.text({ ref: 'name' });
	
	const s1 = bound( { type: 'for', ref: 'items' }, {
		fragment: $tatic([
			$tatic.el( 'span', null, [ t2.node() ]) 
		]),
		bindingTree: [{
			children: [{
				bindings: [ t2 ]
			}]
		}]
	});
	
	const template = {
		fragment: $tatic([ s1.node() ]),
		bindingTree: [{
			bindings: [ s1 ]
		}]
	};
	
	new Diamond( { 
		template, 
		data: { items }, 
		el: fixture 
	});
			
	const elapsed = performance.now() - start;
	
	t.ok( true, `render took ${elapsed}ms` );
	
	console.log( `dom mithril test render: ${elapsed}ms` );
	
});

