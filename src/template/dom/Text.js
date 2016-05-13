import $ from './static';

export default class DOMText {
	
	constructor ( binding ) {
		this.binding = binding;
		this.index = 0;
	}
	
	node () {
		return $.text( '' );
	}
	
	init ( node ) {
		node.appendChild( $.text( '' ) );	
	}
	
	bind ( context, node ) {
		node.lastChild.textContent = context.get( this.binding.ref );
	}
}