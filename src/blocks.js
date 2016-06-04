const blocks = {
	'for': function forBlock( context, ref, render, add, remove ) {
		
		const iterable = context.child( ref );
		iterable.onadd( ( child, index = 0 ) => {
			add( render( child ), index );
		});
		
		iterable.onremove( remove );
		
		
		// // TODO: unsubsribe
		// context.observe( ref, value => {
		// 	if ( Array.isArray( value ) ) {
		// 		for ( var i = 0, l = value.length; i < l; i++ ) {
		// 			add( new Context( value[i] ) );
		// 		}
		// 	}
		// });
	},
	
	'if': function ifBlock( context, ref, render, add, remove ) {
		context.onproperty( ref, value => {
			if ( value ) add( render( context ) );
			else remove();
		});
	},
	
	'with': function withBlock( context, ref, render, add, remove ) {
		const withContext = context.child( ref );
		if ( withContext.value() != null ) add( render( withContext ) );
		else remove();
	}	
};

export default blocks;