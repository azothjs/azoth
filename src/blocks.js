import Context from './Context';

const blocks = {
	'for': function forBlock( context, binding, add ) {
		const value = context.value( binding.ref );
		if ( Array.isArray( value ) ) {
			for ( var i = 0, l = value.length; i < l; i++ ) {
				add( new Context( value[i] ) );
			}
		}
	},
	
	'if': function ifBlock( context, binding, add ) {
		const value = context.value( binding.ref );
		if ( value ) add( context );
	},
	
	'with': function withBlock( context, binding, add ) {
		const value = context.value( binding.ref );
		if ( value != null ) add( new Context( value ) );
	}	
};

export default blocks;