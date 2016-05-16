import { test, module, fixture, skip } from './qunit';
import parser from './parser/parser';

module( 'parser' );

const { bound } = Diamond;

test( 'cleans', t => {
	
	const { html } = parser(`
		<div></div>
	`);
	
	t.equal( html, '<div></div>' );
});

test( 'text binding', t => {
	const { html, bindings } = parser( '<div>{{ hello }}</div>' );
	t.equal( html, '<div data-bind="t1"></div>' );
	t.ok( bindings && bindings.t1 );
	t.equal( bindings.t1.ref, 'hello' );
});

test( 'positioned text binding', t => {
	const { html, bindings } = parser( '<div>hello {{world}}</div>' );
	t.equal( html, '<div data-bind="t1">hello </div>' );
	t.ok( bindings && bindings.t1 );
	t.equal( bindings.t1.ref, 'world' );
	t.equal( bindings.t1.index, 6 );
});

test( 'same ref twice', t => {
	const { html, bindings } = parser( '<div>{{foo}} {{foo}}</div>' );
	t.equal( html, '<div data-bind="t1,t2"> </div>' );
	t.equal( bindings.t1.ref, 'foo' );
	t.equal( bindings.t2.ref, 'foo' );
	t.notOk( bindings.t1.index );
	t.equal( bindings.t2.index, 1 );
});

test( 'nested elements have right text binding', t => {
	const { html, bindings } = parser( '<div>{{greeting}}<span>{{place}}</span>{{person}}</div>' );
	t.equal( html, '<div data-bind="t1,t3"><span data-bind="t2"></span></div>' );
	t.equal( bindings.t1.ref, 'greeting' );
	t.equal( bindings.t2.ref, 'place' );
	t.notOk( bindings.t3.hasOwnProperty( 'index' ), 'text within childNode starts at 0' );
});