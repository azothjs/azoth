import { test, module } from './qunit';
import parser from './parser/parser';

module( 'parser', () => {
	
	module( 'attribute' );

	test( 'basic attribute', t => {
		t.deepEqual( parser( '<div data-foo="{{bar}}">foo</div>' ), {
			html: '<div data-foo data-bind>foo</div>',
			defs: [
				{ ref: 'bar', name: 'data-foo', binder: 'attribute' }
			]
		});
	});
	
	test( 'attribute to value', t => {
		t.deepEqual( parser( '<input value="{{val}}">' ), {
			html: '<input value data-bind>',
			defs: [
				{ ref: 'val', name: 'value', binder: 'property' }
			]
		});
	});
	
	test( 'attribute with non-bound attributes', t => {
		t.deepEqual( parser( '<span class="edit" data-done="{{done}}"></span>' ), {
			html: '<span class="edit" data-done data-bind></span>',
			defs: [
				{ ref: 'done', name: 'data-done', binder: 'attribute' }
			]
		});
	});
});
