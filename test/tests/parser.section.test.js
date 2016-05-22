import { test, module } from './qunit';
import parser from './parser/parser';

module( 'parser', () => {
	
	module( 'section' );
	
	test( 'splits bindings', t => {
		const { html, bindings } = parser( '<ul>{{#for items}}<li>{{.}}</li>{{/for}}</ul>' );
		t.equal( html, '<ul data-bind><section-node></section-node></ul>' );
		t.deepEqual( bindings[0], { 
			binder: 'section', type: 'for', ref: 'items',
			children: {
				html: '<li data-bind></li>',
				bindings: [
					{ binder: 'text', ref: '.' }
				]	
			} 
		});
	});
	
	test( 'orphan section', t => {
		t.deepEqual( parser( '{{#for items}}<span>{{.}}</span>{{/for}}' ), {
			html: '<section-node data-bind></section-node>',
			bindings: [{ 
				binder: 'section', type: 'for', ref: 'items',
				children: {
					html: '<span data-bind></span>',
					bindings: [
						{ binder: 'text', ref: '.' }
					]	
				} 
			}]
		});
	});


});
