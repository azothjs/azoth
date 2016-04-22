import Context from '../Context';
import getBindings from './getBindings';
// import queueBindings from '../queueBindings';

class Block {
	constructor ( section ) {
		this.section = section;
	}
}

class ForBlock extends Block {
	bind( context, add ) {
		const binding = this.section.binding;
		const value = context.get( binding.ref );
		if ( Array.isArray( value ) ) {
			
			add( context, this.section.template.bulkRender( value.length ) );
			
			// for ( var i = 0, l = value.length; i < l; i++ ) {
			// 	add( new Context( value[i] ) );
			// }
			
		}
	}
}

class IfBlock extends Block {
	bind( context, add ) {
		const value = context.get( this.section.binding.ref );
		if ( value ) add( context, this.section.template.render() );
	}	
}

class WithBlock extends Block {
	bind( context, add ) {
		const binding = this.section.binding;
		const value = context.get( binding.ref );
		if ( value != null ) add( new Context( value ), this.section.template.render() );
	}	
}

const blocks = {
	for: ForBlock,
	if: IfBlock,
	with: WithBlock
};

export default blocks;