export default function textBinding ( binding ) {
	
	const ref = binding.ref;
	
	const bindText = function bindText( context, node ) {
		node.lastChild.textContent = context.get( ref );
	}
	
	bindText.init = function initText( node ){
		node.appendChild( document.createTextNode( '' ) );	
	}
	
	return bindText;
}