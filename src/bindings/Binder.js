import section from './section';
import text from './text';
import property from './property';
import attribute from './attribute';

export default class Binder {
	
	constructor() {
		this.bindings = Object.create( null );
	}
	
	text( key, binding ) {
		this.bindings[ key ] = text( binding );
	}
	
	section( key, binding ) {
		this.bindings[ key ] = section( binding, this.bindings );
	}
	
	property( key, name, binding ) {
		this.bindings[ key ] = property( name, binding );
		
	}
	
	attribute( key, name, binding ) {
		this.bindings[ key ] = attribute( name, binding );		
	}
}