import getBindingTree from './getBindingTree';

export default function render( template, context ){
	
	const clone = template.clone();
	const bindingTree = template.bindingTree;
	const queue = [];
	
	function queueBindings( node, bindingTree ) {
		if ( !bindingTree ) return;
		
		var childNodes = Array.isArray( node ) ? node : node.childNodes;
		var map, index, childNode, bindings;
		
		for( var i = 0, l = bindingTree.length; i < l; i++ ){
			map = bindingTree[i];
			index = map.index || 0;
			childNode = childNodes[ index ];
			bindings = map.bindings;
			
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
	
	var each;
	for ( var i = 0, l = queue.length; i < l; i++ ) {
		each = queue[i];
		each.binding.bind( context, each );
	}
	
	return clone;
}