export default class Text {
	
	constructor ( binding ) {
		this.binding = binding;
		this.index = 0;
	}
	
	init ( node ) {
		node.appendChild( document.createTextNode( '' ) );	
	}
	
	bind ( context, node ) {
		node.lastChild.textContent = context.get( this.binding.ref );
	}
}