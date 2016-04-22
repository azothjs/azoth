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
	
$.el = function( name, attr, children ) {
	const element = document.createElement( name );
	
	var l, a;
	
	if ( attr && ( l = attr.length ) ) {
		for ( var i = 0; i < l; i++ ) {
			a = attr[i];
			element.setAttribute( a.name, a.value );
		}
	}
		
	if ( children && children.length ) {
		appendChildren( element, children );
	}
	
	return element;
};

function appendChildren( parent, children ) {
	var child;
	
	for ( var i = 0, l = children.length; i < l; i++ ) {
		child = children[ i ];
		if ( typeof child.node === 'function' ){
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

