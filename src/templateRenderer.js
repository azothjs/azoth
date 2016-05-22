export default function render( { fragment, bindings } ) {
	
	init( fragment );
	
	return function renderer( context ) {
		const clone = fragment.cloneNode( true );
		const nodes = clone.querySelectorAll( '[data-bind]' );
		
		if ( fragment._bindings ) {
			bindings[ nodes.length ]( context, clone );
		}
		
		for ( var i = 0, l = nodes.length, node; i < l; i++ ) {
			node = nodes[i];
			bindings[i]( context, node );
			
			// TODO: make optional, adds a ms or so
			node.removeAttribute( 'data-bind' );
		}
		
		return clone;
	};

}

function init( fragment ) {
	const nodes = fragment.querySelectorAll( 'text-node,section-node' );
	
	for( var i = 0, l = nodes.length, node, type, replacement, parent; i < l; i++ ) {
		
		node = nodes[i];
		if ( node.localName === 'section-node' ) {
			replacement = document.createComment( node.nodeValue );
		}
		else {
			replacement = document.createTextNode( node.nodeValue );
		}
		
		parent = node.parentNode;
		parent.replaceChild( replacement, node );
		
		if ( parent === fragment ) {
			fragment._bindings = true;
		}
	}
}
