import templateRenderer from '../templateRenderer';
import blocks from '../blocks';

export default function sectionBinding ( binding, template ) {
	
	const { fragment, bindings } = template;
	const render = templateRenderer( fragment, bindings );
	
	const index = binding.index || 0;
	
	const block = blocks[ binding.type ];
	if ( !block ) throw new Error( `Unrecognized section type ${binding.type}` );
	
	function bindSection ( context, node ) {
		const anchor = node.childNodes[ index ];
		anchor.textContent = binding.type;
		
		function add( addContext ) {
			const node = render( addContext );
			anchor.parentNode.insertBefore( node, anchor );
		}
		
		block( context, binding, add );
	}
		
	return bindSection;
}
