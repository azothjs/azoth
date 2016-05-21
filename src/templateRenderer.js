import initNodes from './initNodes';
export default function getTemplateRender( fragment, bindings ) {
	
	initNodes( fragment );
	
	return function templateRender( context ) {
		const clone = fragment.cloneNode( true );
		const nodes = clone.querySelectorAll( '[data-bind]' );
		
		var offset = 0;
		
		if ( fragment._bindings ) {
			bindings[0]( context, clone );
			offset = 1;
		}
		
		for ( var i = 0, l = nodes.length, node; i < l; i++ ) {
			node = nodes[i];
			bindings[ i + offset ]( context, node );
			
			// TODO: make optional, adds a ms or so
			node.removeAttribute( 'data-bind' );
		}
		
		return clone;
	};

}
