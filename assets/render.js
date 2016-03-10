export default function render( clonable, tree, context ){
	const clone = clonable.cloneNode( true );
	const renderers = iterate( tree, clone );
	
	var renderer;
	for ( var i = 0, l = renderers.length; i < l; i++ ) {
		renderer = renderers[i];
		renderer.fn( context, renderer.node );
	}
	
	return clone;
}

function iterate( tree, parentNode, queue = [] ) {
	const { renderers, children } = tree;
	
	if ( renderers && renderers.length ) {
		queue.push.apply( queue, renderers.map( fn => ({ fn, node: parentNode }) ) );
	}
	
	if ( children && children.length ) {
		var child;
		for( var i = 0, l = children.length; i < l; i++ ){
			child = children[i];
			iterate( child, parentNode.childNodes[ child.index ], queue );	
		}
	}
	
	return queue;
}

