import { getPosition, adopt } from './childNodeBindings';

export default function textBinding ( binding ) {
	
	const ref = binding.ref;
	var index = 0;
	
	const bindText = function bindText( context, node ) {
		node.childNodes[ index ].textContent = context.get( ref );
	};
	
	bindText.init = function initText( node ){
		index = getPosition( node );
		adopt( node, document.createTextNode( '' ) );
	};
	
	return bindText;
}