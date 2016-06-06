import { test, module } from './qunit';
import parser from './parser/parser';

module( 'new parser', () => {
	
	class Bindings {
		constructor() {
			this.hash = Object.create( null );
			this.b = 0;
		}
		
		add( binding ) {
			const name = `b${this.b++}`;
			this.hash[ name ] = binding;
			return name;
		}
	}
	
	class Context{
		
		constructor( { prop = '.', bindings = new Bindings() } = {} ){
			this.prop = prop;
			this._bindings = bindings;
			this.children = Object.create( null );
		}
		
		[Symbol.toPrimitive]() {
			return this.toString();
		}
		
		toString() {
			const name = this._bindings.add({ 
				ref: this.prop,
				type: 'text'
			});
			return `<text-node data-bind="${name}"></text-node>`;
		}
		
		map( map ) {
			const context = getContext();
			const fragment = map( context ).trim();
			const name = this._bindings.add({ 
				ref: this.prop,
				type: 'map',
				template: { fragment, bindings: context.bindings }
			});			
			return `<section-node data-bind="${name}"></section-node>`;
		}
		
		get bindings() {
			return this._bindings.hash;
		}
		
		getChildContext( name ) {
			let child = this.children[ name ];
			if ( !child ) {
				child = getContext({ prop: name, bindings: this._bindings });
				this.children[ name ] = child; 
			}
			return child;
		}
	}
	
	function getContext( options ){
		const context = new Context( options );

		const handler = {
			get( target, name ){
				if ( name in target ) return target[name];
				
				return target.getChildContext( name );
			}
		};

		return new Proxy( context, handler );

	}
	
	test( 'root text node', t => {
		
		const template = ( place => `
			<span>hello ${place}</span>
		`);
		
		const context = getContext();
		const result = template( context ).trim();
		t.equal( result, '<span>hello <text-node data-bind="b0"></text-node></span>' );
		t.deepEqual( context.bindings, {
			b0: { ref: '.', type: 'text' }
		});
	});
	
	test( 'two children of root in text nodes', t => {
		
		const template = ( ({ first, last }) => `
			<span>${first} ${last}</span>
		`);
		
		const context = getContext();
		const result = template( context ).trim();
		t.equal( result, '<span><text-node data-bind="b0"></text-node> <text-node data-bind="b1"></text-node></span>' );
	});
	
	test( 'map root context', t => {
		
		const template = ( colors => `
			<ul>${colors.map( color => `<li>${color}</li>` )}</ul>
		`);
		
		const context = getContext();
		const result = template( context ).trim();
		t.equal( result, '<ul><section-node data-bind="b0"></section-node></ul>' );
		t.deepEqual( context.bindings, {
			b0: { 
				ref: '.', 
				type: 'map', 
				template: {
					fragment: `<li><text-node data-bind="b0"></text-node></li>`,
					bindings: {
						b0: { ref: '.', type: 'text' }
					}
				}
			}
		});
	});
	
});
