export default class Context {
	constructor ( data ) {
		this.data = data;
		this.refs = Object.create( null );
		this.children = Object.create( null );
		this.adds = [];
		this.removes = [];
	}

	value ( ref = '.' ) {
		return ( ref == null || ref === '.' ) ? this.data : this.data[ ref ];
	}
	
	child( ref ) {
		const context = this.children[ ref ];
		if ( context ) return context;
		
		return this.children[ ref ] = new Context( this.value( ref ) );
	}
	
	set ( value ) {
		this.data = value;
		const handlers = this.adds;
		if ( handlers ) {
			for( var h = 0, l = handlers.length, handler = null; h < l; h++ ) {
				handler = handlers[h];
				if ( Array.isArray( value ) ) {
					for( var i = 0, vl = value.length; i < vl; i++ ) {
						handler( this.child(i) );
					}
				}
			}
		}
	}
	
	onproperty( ref, handler ) {
		const refs = this.refs;
		const handlers = refs[ ref ] || ( refs[ ref ] = [] );
		// TODO: how to unsubscribe
		handlers.push( handler );
		
		const value = this.value( ref );
		if ( value != null ) handler( value );
	}
	
	onval( handler ) {
		
	}
	
	// these go tp iterable context only i think
	onadd( handler ) {
		// TODO: how to unsubscribe
		this.adds.push( handler );
		
		const val = this.data;
		// TODO: [Symbol.iterator]
		if ( Array.isArray( val ) ) {
			for( var i = 0, l = val.length; i < l; i++ ) {
				handler( this.child(i) );
			}
		}
	}
	
	onremove( handler ) {
		// TODO: how to unsubscribe
		this.removes.push( handler );
	}
}
