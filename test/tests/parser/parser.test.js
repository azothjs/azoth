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
		const { html, fragment } = parser( `<div>{{foo}}</div>`, { live: true } );
		t.notOk( html );
		t.ok( fragment instanceof DocumentFragment );
		t.notOk( )
	});
});
