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

// http://www.sitepoint.com/removing-useless-nodes-from-the-dom/
// TODO: get node type code
export function clean(node)
{
	for( var n = 0, child; n < node.childNodes.length; n++ ) {
		child = node.childNodes[n];
		if( (child.nodeType === 3 && !/\S/.test(child.nodeValue)) ) {
			node.removeChild(child);
			n --;
		}
		else if( child.nodeType === 1 ) {
			clean(child);
		}
	}
	return node;
}

export function getPosition( node ) {
	var i = 0, prev = node;
	while( prev = prev.previousSibling ) i++;
	return i;
}