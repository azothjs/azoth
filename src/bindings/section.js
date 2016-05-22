import templateRenderer from '../templateRenderer';
import blocks from '../blocks';

export default function sectionBinding ( binding, template ) {
	
	const render = templateRenderer( template );
	const { type, index = 0 } = binding;
	const block = blocks[ type ];
	
	if ( !block ) throw new Error( `Unrecognized section type ${type}` );
	
	return ( context, { childNodes } ) => {
		const anchor = childNodes[ index ];
		const host = anchor.parentNode;
		// TODO: move this to init (matters for sections of sections)
		anchor.textContent = type;
		
		block( context, binding, context => {
			host.insertBefore( render( context ), anchor );
		});
	};
}
