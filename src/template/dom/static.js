import Binding from '../../Binding';

export default function $( children ) {
	return $.section( children );
}

$.section = function( children ) {
	const fragment = document.createDocumentFragment();
	appendChildren( fragment, children );
	return fragment;
};
	
$.text = function( text ) {
	return document.createTextNode( text );
};
	
$.comment = function( comment ) {
	return document.createComment( comment );
};
	
$.el = function( name, children ) {
	const element = document.createElement( name );
	appendChildren( element, children );
	return element;
};

function appendChildren( parent, children ) {
	var child;
	
	for ( var i = 0, l = children.length; i < l; i++ ) {
		child = children[ i ];
		if ( child instanceof Binding ){
			child = getNodeFromBinding( child );
		};
		parent.appendChild( child );
	}
}

function getNodeFromBinding( binding ) {
	const node = binding.node();
	node._binding = binding;
	return node;
}

