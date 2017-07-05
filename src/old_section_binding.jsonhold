import renderer from '../renderer';
import blocks from '../blocks';

export default function sectionBinding ( binding ) {
	
	const render = renderer( binding.template );
	const { type, ref, index = 0 } = binding;
	const block = blocks[ type ];
	
	if ( !block ) throw new Error( `Unrecognized section type ${type}` );
	
	return ( { childNodes }, context, owner ) => {
		const anchor = childNodes[ index ];
		const host = anchor.parentNode;
		
		// TODO: make this dev only
		anchor.textContent = type;
		
		const instances = [];
		
		const add = ( context, start = instances.length ) => {
			const node = render( context );
			const childNodes = node.childNodes;
			
			const insert = childNodes.length === 1 
				? childNodes[0] 
				: [].slice.call( node.childNodes );
				
			instances.splice( start, 0, insert );
			host.insertBefore( node, anchor );
		};
		
		const remove = ( start = 0, length = 1 ) => {
			instances.splice( start, length );
		};
		
		block( context, ref, add, remove );
	};
}
