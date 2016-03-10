export default function render( clonable, tree, context ){
	const clone = clonable.cloneNode( true );
	const renderers = iterate( tree[0], clone );
	renderers.forEach( r => r.fn( context, r.node ) );
	return clone;
}

function iterate( tree, parentNode, queue = [] ) {
	Object.keys( tree ).forEach( key => {
		if ( key === 'child' ) return;
		
		if ( key === 'fn' ) {
			queue.push.apply( queue, tree.fn.map( fn => ({ fn, node: parentNode }) ) );
		}
		else {
			iterate( tree[ key ], parentNode.childNodes[ key ], queue );
		}
	});
	return queue;
}

