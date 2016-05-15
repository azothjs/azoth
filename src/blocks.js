import Context from './Context';

const blocks = {
	'for'( context, binding, add ) {
		const value = context.get( binding.ref );
		if ( Array.isArray( value ) ) {
			for ( var i = 0, l = value.length; i < l; i++ ) {
				add( new Context( value[i] ) );
			}
		}
	},
	
	'if'( context, binding, add ) {
		const value = context.get( binding.ref );
		if ( value ) add( context );
	},
	
	'with'( context, binding, add ) {
		const value = context.get( binding.ref );
		if ( value != null ) add( new Context( value ) );
	}	
};

export default blocks;