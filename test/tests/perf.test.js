import Context from './Context';
import dom from './template/dom';
import getBindingTree from './getBindingTree';
import render from './render';

const test = QUnit.test;
const module = QUnit.module;
const fixture = document.getElementById( 'qunit-fixture' );
const skip = { test: () => {} };


const { $, Đ } = dom;

function renderToFixture( clonable, data ){
	const context = new Context( data );
	const bindingTree = getBindingTree( clonable.childNodes );
	
	//clone method is dom specific
	const template = {
		clone() { return clonable.cloneNode( true ); },
		bindingTree
	};
	const rendered = render( template, context );
	
	//dom specific
	fixture.appendChild( rendered );
}

module( 'performance' );

const count = 1000;
const treshhold = 150;

test( `12 column table with ${count} rows < ${treshhold}ms`, t => {
	
	const items = [];
	const columns = [ 'message', 'number', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth']
	
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
	
	const children = columns.map( ref => {
		return $.el( 'td', [ Đ.text({ ref }) ]);
	});
	
	const fragment = $([
		$.el( 'table', [
			Đ( { type: 'for', ref: 'items' }, {
				clonable: $([
					$.el( 'tr', children ) 
				])
			})
		])
	]);
	
	renderToFixture( fragment, { items } );
	
	const elapsed = performance.now() - start;
	
	t.ok( elapsed < treshhold, `render took ${elapsed}ms` );
	
	console.log( `${count} items: ${elapsed}ms` );
	
});
