const blocks = {
	'for': function forBlock( context, ref, add, remove ) {
		
		const iterable = context.child( ref );
		iterable.onadd( add );
		iterable.onremove( remove );
		
	},
	
	'if': function ifBlock( context, ref, add, remove ) {
		context.onproperty( ref, value => {
			if ( value ) add( context );
			else remove();
		});
	},
	
	'with': function withBlock( context, ref, add, remove ) {
		const withContext = context.child( ref );
		if ( withContext.value() != null ) add( withContext );
		else remove();
	}	
};

export default blocks;