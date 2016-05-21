import section from './section';
import text from './text';
import property from './property';
import attribute from './attribute';

export class Binder {
	
	constructor() {
		this.bindings = [];
	}
	
	text( binding ) {
		this.bindings.push( text( binding ) );
	}
	
	section( binding ) {
		this.bindings.push( section( binding, this.bindings ) );
	}
	
	property( binding ) {
		this.bindings.push( property( binding ) );
	}
	
	attribute( binding ) {
		this.bindings.push( attribute( binding ) );		
	}
	
	wrap( indexes ) {
		const bindings = this.bindings;
		const l = indexes.length;
		bindings.push( ( context, node ) => {
			for( var i = 0; i < l; i++ ) bindings[ indexes[i] ]( context, node );
		});
	}
}

function wrap( bindings ) {
	const l = bindings.length;
	return ( context, node ) => {
		for( var i = 0; i < l; i++ ) bindings[i]( context, node );
	}; 
}

export const bound = {
	text, section, property, attribute, wrap
};