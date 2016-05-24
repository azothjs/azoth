import renderer from '../renderer';
import blocks from '../blocks';

export default function sectionBinding ( binding ) {
	
	const render = renderer( binding.template );
	const { type, index = 0 } = binding;
	const block = blocks[ type ];
	
	if ( !block ) throw new Error( `Unrecognized section type ${type}` );
	
	return ( context, { childNodes } ) => {
		const anchor = childNodes[ index ];
		const host = anchor.parentNode;
		// TODO: move this to init (matters for sections of sections)
		anchor.textContent = type;
		
		block( context, binding, context => {
			const node = render( context );
			host.insertBefore( node, anchor );
		});
	};
}
