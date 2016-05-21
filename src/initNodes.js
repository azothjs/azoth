/* eslint indent: "off" */

export default function initNodes( fragment ) {
	const nodes = fragment.querySelectorAll( 'node-slot' );
	
	for( var i = 0, l = nodes.length, node, type, replacement, parent; i < l; i++ ) {
		
		node = nodes[i];
		type = node.dataset.type;
		
		switch ( +type ) {
			case Node.COMMENT_NODE:
				replacement = document.createComment( node.nodeValue );
				break;
			default:
				replacement = document.createTextNode( node.nodeValue );
				break;
		}
		
		parent = node.parentNode;
		parent.replaceChild( replacement, node );
		
		if ( parent === fragment ) {
			fragment._bindings = true;
		}
	}
}