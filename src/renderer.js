export default function renderer( { fragment, bindings } ) {
	
	init( fragment );
	const bind = typeof bindings === 'function' ? bindings() : null;
	
	return function render( context, owner ) {
		const clone = fragment.cloneNode( true );
		const nodes = clone.querySelectorAll( '[data-bind]' );
		
		// orphan bindings are stored at the end,
		// and executed first as top of node tree
		// if ( fragment._orphans ) {
		// 	bindings[ nodes.length ]( clone, context, owner );
		// }

		bind( nodes, context, clone );
		
		// TODO: make optional, adds a ms or so
		// for ( var i = 0, l = nodes.length; i < l; i++ ) {
		// 	nodes[i].removeAttribute( 'data-bind' );
		// }
		
		return clone;
	};

}

const replace = {
	'text-node': node => document.createTextNode( '' ),
	'section-node': node => document.createComment( 'section' )
};

const query = Object.keys( replace ).join();

function init( fragment ) {
	const nodes = fragment.querySelectorAll( query );
	
	let  node = null, parent = null, newNode = null;
	
	for( var i = 0, l = nodes.length; i < l; i++ ) {
		node = nodes[i];
		parent = node.parentNode;
		newNode = replace[ node.localName ]( node );
		parent.replaceChild( newNode, node );
		// track if orphans nodes with no clonable parent
		if ( parent === fragment ) fragment._orphans = true;
	}
}
