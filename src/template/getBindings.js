export default function getBindings( clone, bindingTree ) {
			
	const queue = [];
	
	function queueBindings( node, bindingTree ) {
		if ( !bindingTree ) return;
		
		const childNodes = node.childNodes;
		
		var map, index, childNode, bindings;
		
		for( var i = 0, l = bindingTree.length; i < l; i++ ){
			map = bindingTree[i];
			bindings = map.bindings;
			index = map.index || 0;
			childNode = childNodes[ index ];
			
			if ( bindings ) {
				for( var j = 0, bl = bindings.length; j < bl; j++ ) {
					queue.push({ 
						binding: bindings[j],
						node: childNode,
						parent: node,
						index,
					});
				}
			}
			
			queueBindings( childNode, map.children );	
		}
	}	
	
	queueBindings( clone, bindingTree );
	
	return queue;
}