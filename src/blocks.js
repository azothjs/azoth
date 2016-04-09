import Context from './Context';

class ForBlock {
	bind( context, binding, add ) {
		const value = context.get( binding.ref );
		if ( Array.isArray( value ) ) {
			for ( var i = 0, l = value.length; i < l; i++ ) {
				add( new Context( value[i] ) );
			}
		}
	}
}

class IfBlock {
	bind( context, binding, add ) {
		const value = context.get( binding.ref );
		if ( value ) add( context );
	}	
}

class WithBlock {
	bind( context, binding, add ) {
		const value = context.get( binding.ref );
		if ( value != null ) add( new Context( value ) );
	}	
}

const blocks = {
	for: ForBlock,
	if: IfBlock,
	with: WithBlock
};

export default blocks;