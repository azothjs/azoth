export default class Template {
	
	constructor ( template ) {
		const nodes = getBoundNodes( this.fragment = template.fragment );
		initNodes( nodes, this.bindings = template.bindings );
	}
	
	render() {
		const node = this.fragment.cloneNode( true );
		const nodes = getBoundNodes( node );
		const queue = queueNodesAndBindings( nodes, this.bindings );
		return { node, queue };
	}
}

function getBoundNodes( fragment, bindings, method ) {
	return fragment.querySelectorAll( '[data-bind]' );
}

function initNodes( nodes, bindings ) {
	for( var i = 0, l = nodes.length, node, binding; i < l; i++ ) {
		node = nodes[i];
		// list = node.dataset.bind.split( ',' );
		
		binding = bindings[ node.dataset.bind ];
		if ( binding && binding.init ) {
			binding.init( node );
		}
			
		// for ( var b = 0, bl = list.length, binding; b < bl; b++ ) {
		// 	binding = bindings[ list[b] ];
		// 	if ( binding ) {
		// 		binding.init( node );
		// 	}
		// }
	}	
}

function queueNodesAndBindings( nodes, bindings ) {
	const l = nodes.length;
	const queue = [];
	
	for( var i = 0, node, binding; i < l; i++ ) {
		node = nodes[i];
		// list = node.dataset.bind.split( ',' );
		
		binding = bindings[ node.dataset.bind ];
		
		if ( !binding ) throw new Error( `unrecognized binding ${node.dataset.bind}` );
		
		queue.push( { node, binding } );
		
		// for ( var b = 0, bl = list.length, binding; b < bl; b++ ) {
		// 	binding = bindings[ list[b] ];
		// 	if ( binding ) {
		// 		queue.push( { node, binding } );
		// 	}
		// }
		
		//TODO: test perf w/ and w/o this:
		//node.removeAttribute( 'data-bind' );
	}	
	
	return queue;
}

