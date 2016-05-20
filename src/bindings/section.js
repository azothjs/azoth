import templateRenderer from '../templateRenderer';
import bind from '../bind';
import blocks from '../blocks';
import { getPosition, adopt } from './childNodeBindings';

export default function sectionBinding ( binding, bindings ) {
	
	const block = blocks[ binding.type ];
	
	var index = 0, render = null;
	
	if ( !block ) throw new Error( `Unrecognized section type ${binding.type}` );
	
	function bindSection ( context, node ) {
		const anchor = node.childNodes[ index ];
		
		function add( addContext ) {
			const { queue, node } = render();
			bind( queue, addContext );
			anchor.parentNode.insertBefore( node, anchor );
		}
		
		block( context, binding, add );
	}
	
	bindSection.init = function initSection( node ){
		index = getPosition( node );
		adopt( node, document.createComment( binding.type ) );
		
		const fragment = copyToFragment( node.childNodes );
		
		render = templateRenderer( fragment, bindings );
	};
	
	return bindSection;
}

function copyToFragment( nodes ) {
	const fragment = document.createDocumentFragment();
	for( var i = 0, l = nodes.length; i < l; i++ ) {
		fragment.appendChild( nodes[i] );
	}
	return fragment;
}