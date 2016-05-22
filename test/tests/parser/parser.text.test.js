import { test, module } from './qunit';
import parser from './parser/parser';

module( 'parser', () => {
	
	module( 'text' );

	test( 'text binding', t => {
		t.deepEqual( parser( '<div>{{ hello }}</div>' ), {
			html: '<div data-bind></div>',
			defs: [
				{ ref: 'hello', binder: 'text' }
			]
		});
	});
	
	test( 'orphan binding', t => {
		t.deepEqual( parser( '{{ foo }}' ), {
			html: '<text-node data-bind></text-node>',
			defs: [
				{ ref: 'foo', binder: 'childText' } 
			]
		});
	});

	test( 'positioned text binding', t => {
		t.deepEqual( parser( '<div>hello {{world}}</div>' ), {
			html: '<div data-bind>hello <text-node></text-node></div>',
			defs: [
				{ ref: 'world', binder: 'childText', index: 1 } 	
			]
		});
	});

	test( 'same ref twice', t => {
		t.deepEqual( parser( '<div>{{foo}} {{foo}}</div>' ), {
			html: '<div data-bind><text-node></text-node> <text-node></text-node></div>',
			defs: [{ 
				binder: 'wrap',
				wrapped: [
					{ ref: 'foo', binder: 'childText' },
					{ ref: 'foo', binder: 'childText', index: 2 }
				]
			}]
		});
	});

	test( 'text in nested elements', t => {
		t.deepEqual( parser( '<div>{{greeting}}<span>{{place}}</span>{{person}}</div>' ), {
			html: '<div data-bind><text-node></text-node><span data-bind></span><text-node></text-node></div>',
			defs: [{ 
				binder: 'wrap',
				wrapped: [
					{ ref: 'greeting', binder: 'childText' },
					{ ref: 'person', binder: 'childText', index: 2 }
				] 
			},
				{ ref: 'place', binder: 'text' }
			]
		});
	});	
});
