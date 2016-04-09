import Binding from '../../Binding';

export default function $( children ) {
	return $.section( children );
}

$.section = function( children ) {
	const fragment = [];
	appendChildren( fragment, children );
	return fragment;
};
	
$.text = function( text ) {
	return text;
};
	
$.comment = function( comment ) {
	return comment;
};
	
$.el = function( name, children ) {
	const content = [];
	appendChildren( content, children );
	const element = [ `<${name}>`, content, `</${name}>` ];
	return element;
};

function appendChildren( parent, children ) {
	var child;
	
	for ( var i = 0, l = children.length; i < l; i++ ) {
		child = children[ i ];
		if ( child instanceof Binding ){
			child = getNodeFromBinding( child );
		};
		parent[i] = child;
	}
}

function getNodeFromBinding( binding ) {
	const node = binding.node();
	node._binding = binding;
	return node;
}

