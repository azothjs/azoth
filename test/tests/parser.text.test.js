import { test, module } from './qunit';
import parser from './parser/parser';

module( 'parser', () => {
	
	test( 'trims', t => {
		const { html } = parser(`
			<div></div>
		`);
		t.equal( html, '<div></div>' );
	});
	
	module( 'text' );

	test( 'text binding', t => {
		const { html, bindings } = parser( '<div>{{ hello }}</div>' );
		t.equal( html, '<div data-bind></div>' );
		t.deepEqual( bindings[0], { ref: 'hello', binder: 'text' } );
	});
	
	test( 'orphan binding', t => {
		const { html, bindings } = parser( '{{ foo }}' );
		t.equal( html, '<text-node data-bind></text-node>' );
		t.deepEqual( bindings[0], { ref: 'foo', binder: 'childText' } );
	});

	test( 'positioned text binding', t => {
		const { html, bindings } = parser( '<div>hello {{world}}</div>' );
		t.equal( html, '<div data-bind>hello <text-node></text-node></div>' );
		t.deepEqual( bindings[0], { ref: 'world', binder: 'childText', index: 1 } );
	});

	test( 'same ref twice', t => {
		const { html, bindings } = parser( '<div>{{foo}} {{foo}}</div>' );
		t.equal( html, '<div data-bind><text-node></text-node> <text-node></text-node></div>' );
		t.equal( bindings[0].type, 'wrap' );
		const wrapped = bindings[0].bindings;
		t.deepEqual( wrapped[0], { ref: 'foo', binder: 'childText' } );
		t.deepEqual( wrapped[1], { ref: 'foo', binder: 'childText', index: 2 } );
	});

	test( 'text in nested elements', t => {
		const { html, bindings } = parser( '<div>{{greeting}}<span>{{place}}</span>{{person}}</div>' );
		t.equal( html, '<div data-bind><text-node></text-node><span data-bind></span><text-node></text-node></div>' );
		t.equal( bindings[0].type, 'wrap' );
		const wrapped = bindings[0].bindings;
		t.deepEqual( wrapped[0], { ref: 'greeting', binder: 'childText' } );
		t.deepEqual( wrapped[1], { ref: 'person', binder: 'childText', index: 2 } );
		
		t.deepEqual( bindings[1], { ref: 'place', binder: 'text' } );
	});	
});
