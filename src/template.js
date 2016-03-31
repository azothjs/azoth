class Binding {
	constructor ( binding ) {
		this.binding = binding;
	}	
}

class DOMText extends Binding {
	node () {
		return $.text( '' );
	}
	
	bind ( context, node ) {
		node.textContent = context.get( this.binding.ref );
	}
}

export function $( children ) {
	const fragment = document.createDocumentFragment();
	
	for ( var i = 0, l = children.length; i < l; i++ ) {
		fragment.appendChild( children[ i ] );
	}
	
	return fragment;
}

$.text = function ( text ) {
	return document.createTextNode( text );
}
	
$.el = function ( name, children ) {
	const element = document.createElement( name );
	const bindings = [];
	
	var child, binding;
	
	for ( var i = 0, l = children.length; i < l; i++ ) {
		child = children[ i ];
		if ( child instanceof Binding ){
			binding = child;
			child = child.node();
			child._binding = binding;
		};
		element.appendChild( child );
	}
	
	return element;
}

export const Đ = {
	text ( binding ) {
		return new DOMText( binding );
	}
}
