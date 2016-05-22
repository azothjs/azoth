import { test, module } from './qunit';
import parser from './parser/parser';

module( 'parser', () => {
	
	module( 'options' );
	
	test( 'trims', t => {
		const { html } = parser(`
			<div></div>
		`);
		t.equal( html, '<div></div>' );
	});
	
	test( 'live: true', t => {
		const { html, fragment, defs, bindings } = parser( `<div>{{foo}}</div>`, { live: true } );
		t.notOk( html );
		t.ok( fragment instanceof DocumentFragment );
		t.notOk( defs );	
		t.equal( bindings.length, 1 );
		t.equal( typeof bindings[0], 'function' );
	});
	
	test( 'section with live: true', t => {
		const { html, fragment, defs, bindings } = parser( 
			`<div>{{#for items}}{{.}}{{/for}}`, { live: true } );
		t.notOk( html );
		t.ok( fragment instanceof DocumentFragment );
		t.equal( fragment.childNodes.length, 1 )
		t.notOk( defs );	
		t.equal( bindings.length, 1 );
		t.equal( typeof bindings[0], 'function' );
	});
});
