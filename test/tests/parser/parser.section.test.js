import { test, module } from './qunit';
import parser from './parser/parser';

module( 'parser', () => {
	
	module( 'section' );
	
	test( 'splits bindings', t => {
		t.deepEqual( parser( '<ul>{{#for items}}<li>{{.}}</li>{{/for}}</ul>' ), {
			html: '<ul data-bind><section-node></section-node></ul>',
			defs: [{
				binder: 'section', type: 'for', ref: 'items',
				template: {
					html: '<li data-bind></li>',
					defs: [
						{ binder: 'text', ref: '.' }
					]	
				} 	
			}]
		});
	});
	
	test( 'orphan section', t => {
		t.deepEqual( parser( '{{#for items}}<span>{{.}}</span>{{/for}}' ), {
			html: '<section-node data-bind></section-node>',
			defs: [{ 
				binder: 'section', type: 'for', ref: 'items',
				template: {
					html: '<span data-bind></span>',
					defs: [
						{ binder: 'text', ref: '.' }
					]	
				} 
			}]
		});
	});


});
