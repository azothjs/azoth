import makeRender from '../makeRender';
import bind from '../bind';
import blocks from '../blocks';

export default function sectionBinding ( binding, rawTemplate ) {
	
	const render = makeRender( rawTemplate );
	const block = blocks[ binding.type ];
	
	if ( !block ) throw new Error( `Unrecognized section type ${binding.type}` );
	
	return function bindSection ( context, node ) {
		const anchor = document.createComment( binding.type );
		node.parentNode.replaceChild( anchor, node );
		
		function add( addContext ) {
			const { queue, node } = render();
			bind( queue, addContext );
			anchor.parentNode.insertBefore( node, anchor );
		}
		
		block( context, binding, add );
	}
}