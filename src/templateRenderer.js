export default function getTemplateRender( fragment, bindings ) {
	
	return function templateRender() {
		const node = fragment.cloneNode( true );
		const boundNodes = node.querySelectorAll( '[data-bind]' );
		var queue = [];
		if ( fragment.dataset ) {
			queue.push( bindNode( node, fragment.dataset.bind ) );
		}
		queueNodesAndBindings( boundNodes, queue );
		return { node, queue };
	};

	function bindNode( node, key ) {
		const binding = bindings[ key ];
		if ( !binding ) throw new Error( `unrecognized binding ${key}` );
		return { node, binding };
	}

	function queueNodesAndBindings( nodes, queue ) {
		const l = nodes.length;
		
		for( var i = 0, node; i < l; i++ ) {
			node = nodes[i];
			queue.push( bindNode( node, node.dataset.bind ) );
			// TODO: make optional, adds a ms or so
			node.removeAttribute( 'data-bind' );
		}	
		
		return queue;
	}
}

