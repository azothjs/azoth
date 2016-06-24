export default function renderer( fragment ) {
	
	init( fragment );
	
	return function render() {
		const clone = fragment.cloneNode( true );
		const nodes = clone.querySelectorAll( '[data-bind]' );
		nodes[ nodes.length ] = clone;
		return nodes;
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
