export default function render( clonable, bindingTree, context ){
	const clone = clonable.cloneNode( true );
	
	const queue = [];
	
	function queueBindings( node, bindingTree ) {
		if ( !bindingTree ) return;
		
		var childNodes = node.childNodes;
		var map, childNode, bindings;
		
		for( var i = 0, l = bindingTree.length; i < l; i++ ){
			map = bindingTree[i];
			node = childNodes[ map.index || 0 ];
			bindings = map.bindings;
			
			if ( bindings ) {
				for( var j = 0, cl = bindings.length; j < l; j++ ) {
					bindings.push({ node, binding: bindings[j] });
				}
			}
			
			queueBindings( node, child.children );	
		}
	}
	
	queueBindings( clone, bindingTree );
	
	var each;
	for ( var i = 0, l = queue.length; i < l; i++ ) {
		each = queue[i];
		each.binding.bind( context, each.node );
	}
	
	return clone;
}