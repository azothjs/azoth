import templateRenderer from '../templateRenderer';
import blocks from '../blocks';

export default function sectionBinding ( binding, template ) {
	
	const render = templateRenderer( template );
	const type = binding.type;
	const index = binding.index || 0;
	const block = blocks[ type ];
	
	if ( !block ) throw new Error( `Unrecognized section type ${type}` );
	
	function bindSection ( context, node ) {
		const anchor = node.childNodes[ index ];
		// TODO: move this to init (matters for sections of sections)
		anchor.textContent = type;
		
		function add( addContext ) {
			const node = render( addContext );
			anchor.parentNode.insertBefore( node, anchor );
		}
		
		block( context, binding, add );
	}
		
	return bindSection;
}
