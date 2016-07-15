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

export function makeDiv( html ) {
	div.innerHTML = html;
	return div;
}

export function makeHtml( html ) {
	return makeDiv( html ).innerHTML;
}

// export function clean(node)
// {
// 	for( var n = 0, child; n < node.childNodes.length; n++ ) {
// 		child = node.childNodes[n];
// 		if( (child.nodeType === 3 && !/\S/.test(child.nodeValue)) ) {
// 			node.removeChild(child);
// 			n --;
// 		}
// 		else if( child.nodeType === 1 ) {
// 			clean(child);
// 		}
// 	}
// 	return node;
// }