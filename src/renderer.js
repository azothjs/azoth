export default function renderer( fragment ) {
	
	init( fragment );
	
	return function render() {
		const clone = fragment.cloneNode(true);
		const nodes = clone.querySelectorAll('[data-bind]');
		nodes[ nodes.length ] = clone;
		return nodes;
	};
}

const replace = {
	'text-node': () => document.createTextNode( '' ),
	'block-node': () => document.createComment( 'block' )
};

const query = Object.keys( replace ).join();

function init( fragment ) {

	const nodes = fragment.querySelectorAll( query );
	
	let  node = null, newNode = null;
	
	for( var i = 0, l = nodes.length; i < l; i++ ) {
		node = nodes[i];
		newNode = replace[ node.localName ]( node );
		node.parentNode.replaceChild( newNode, node );
	}
}