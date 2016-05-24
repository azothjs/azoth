export default function renderer( { fragment, bindings } ) {
	
	init( fragment );
	
	return function render( context ) {
		const clone = fragment.cloneNode( true );
		const nodes = clone.querySelectorAll( '[data-bind]' );
		
		// orphan bindings are stored at the end,
		// and executed first as top of node tree
		if ( fragment._orphans ) {
			bindings[ nodes.length ]( context, clone );
		}
		
		for ( var i = 0, l = nodes.length, node = null; i < l; i++ ) {
			node = nodes[i];
			bindings[i]( context, node );
			
			// TODO: make optional, adds a ms or so
			node.removeAttribute( 'data-bind' );
		}
		
		return clone;
	};

}

const replace = {
	'text-node': node => document.createTextNode( node.nodeValue ),
	'section-node': node => document.createComment( node.nodeValue )
};

const query = Object.keys( replace ).join();

function init( fragment ) {
	const nodes = fragment.querySelectorAll( query );
	
	for( var i = 0, l = nodes.length, node = null, parent = null, newNode = null; i < l; i++ ) {
		node = nodes[i];
		parent = node.parentNode;
		newNode = replace[ node.localName ]( node );
		parent.replaceChild( newNode, node );
		// track if orphans nodes with no clonable parent
		if ( parent === fragment ) fragment._orphans = true;
	}
}
