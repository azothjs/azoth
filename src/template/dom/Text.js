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
		this.index = node.childNodes.length;
		node.appendChild( $.text( '' ) );	
	}
	
	bind ( context, node ) {
		node.childNodes[ this.index ].textContent = context.get( this.binding.ref );
	}
}