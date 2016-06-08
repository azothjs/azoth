const div = document.createElement( 'div' );

export function makeFragment( html ) {
	return toFragment( makeDiv( html ).childNodes );
}

export function toFragment( childNodes ) {
	const fragment = document.createDocumentFragment();
	
	var node;
	while( node = childNodes[0] ) {
		fragment.appendChild( node );
	}
	
	return fragment;
}

export function makeDiv( html, options = { clean: true } ) {
	div.innerHTML = html;
	if ( options.clean ) clean( div );
	return div;
}

export function makeHtml( html ) {
	return makeDiv( html ).innerHTML;
}

export function clean(node)
{
	for( var n = 0, child; n < node.childNodes.length; n++ ) {
		child = node.childNodes[n];
		if( (child.nodeType === 3 && !/\S/.test(child.nodeValue)) ) {
			node.removeChild(child);
			n --;
		}
	}
	return node;
}

export function getPosition( node ) {
	var i = 0, prev = node;
	while( prev = prev.previousSibling ) i++;
	return i;
}

export function addBinding( node, BINDING_ATTR, name ) {
	var attr = node.getAttribute( BINDING_ATTR ) || '';
	if ( attr ) attr += ',';
	node.setAttribute( BINDING_ATTR, attr += name );
}