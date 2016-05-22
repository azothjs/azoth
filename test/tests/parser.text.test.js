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
		t.deepEqual( parser( '<div>{{ hello }}</div>' ), {
			html: '<div data-bind></div>',
			bindings: [
				{ ref: 'hello', binder: 'text' }
			]
		});
	});
	
	test( 'orphan binding', t => {
		t.deepEqual( parser( '{{ foo }}' ), {
			html: '<text-node data-bind></text-node>',
			bindings: [
				{ ref: 'foo', binder: 'childText' } 
			]
		});
	});

	test( 'positioned text binding', t => {
		t.deepEqual( parser( '<div>hello {{world}}</div>' ), {
			html: '<div data-bind>hello <text-node></text-node></div>',
			bindings: [
				{ ref: 'world', binder: 'childText', index: 1 } 	
			]
		});
	});

	test( 'same ref twice', t => {
		t.deepEqual( parser( '<div>{{foo}} {{foo}}</div>' ), {
			html: '<div data-bind><text-node></text-node> <text-node></text-node></div>',
			bindings: [{ 
				binder: 'wrap',
				bindings: [
					{ ref: 'foo', binder: 'childText' },
					{ ref: 'foo', binder: 'childText', index: 2 }
				]
			}]
		});
	});

	test( 'text in nested elements', t => {
		t.deepEqual( parser( '<div>{{greeting}}<span>{{place}}</span>{{person}}</div>' ), {
			html: '<div data-bind><text-node></text-node><span data-bind></span><text-node></text-node></div>',
			bindings: [{ 
				binder: 'wrap',
				bindings: [
					{ ref: 'greeting', binder: 'childText' },
					{ ref: 'person', binder: 'childText', index: 2 }
				] 
			},
				{ ref: 'place', binder: 'text' }
			]
		});
	});	
});
