export default class Context {
	constructor ( data ) {
		this.data = data;
		this.refs = Object.create( null );
	}

	value ( ref ) {
		return ref === '.' ? this.data : this.data[ ref ];
	}
	
	child( ref ) {
		return new Context( this.get( ref ) );
	}
	
	set ( ref, value ) {
		this.data[ ref ] = value;
		const handlers = this.refs[ ref ];
		if ( handlers ) {
			for( var i = 0, l = handlers.length; i < l; i++ ) {
				handlers[i]( value );
			}
		}
	}
	
	observe( ref, handler ) {
		const refs = this.refs;
		const handlers = refs[ ref ] || ( refs[ ref ] = [] );
		// TODO: how to unsubscribe
		handlers.push( handler );
		
		const value = this.value( ref );
		if ( value != null ) handler( value );
	}
}
