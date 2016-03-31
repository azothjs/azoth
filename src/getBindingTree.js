export default function getBindingTree( childNodes ) {
	
	if ( !childNodes ) return;
	const l = childNodes.length;
	if ( !l ) return;
	
	var results, childNode, result, children, binding
	
	for( var i = 0; i < l; i++ ) {
	
		childNode = childNodes[i];
		result = null;
		 
		children = getBindingTree( childNode.childNodes );
		
		if ( children ) {
			result = { children };
		}
		
		binding = childNode._binding;
		
		if( binding ) {
			result = result || {};
			result.bindings = [ binding ];
			delete childNode._binding;
		}
		
		if ( result ) {
			if (i) result.index = i;
			results = results || [];
			results.push( result );
		}	
	}
	
	return results.length ? results : null;	
}