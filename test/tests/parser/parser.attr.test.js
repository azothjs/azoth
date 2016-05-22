import { test, module } from './qunit';
import parser from './parser/parser';

module( 'parser', () => {
	
	module( 'attribute' );

	test( 'basic attribute', t => {
		
		t.deepEqual( parser( '<div data-foo="{{bar}}">foo</div>' ), {
			
			html: '<div data-foo data-bind>foo</div>',
			
			defs: [
				{ binder: 'attribute', ref: 'bar', name: 'data-foo'  }
			]
		});
		
	});
	
	test( 'attribute to value', t => {
		
		t.deepEqual( parser( '<input value="{{val}}">' ), {
			
			html: '<input value data-bind>',
			
			defs: [
				{ binder: 'property', ref: 'val', name: 'value' }
			]
		});
		
	});
	
	test( 'attribute with non-bound attributes', t => {
		
		t.deepEqual( parser( '<span class="edit" data-done="{{done}}"></span>' ), {
			
			html: '<span class="edit" data-done data-bind></span>',
			
			defs: [
				{ binder: 'attribute', ref: 'done', name: 'data-done' }
			]
		});
		
	});
});
