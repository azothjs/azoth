export function getPosition( el ) {
	var i = 0, prev = el;
	while( prev = prev.previousSibling ) i++;
	return i;
}

const copyAttribute = ( target, bindingKeys ) => {
	//TODO: clone vs set perf testing
	target.setAttribute( 'data-bind', bindingKeys );	
};

export function adopt( node, replacement ) {
	const parent = node.parentNode;
	const bindingKey = node.getAttribute( 'data-bind' );
	
	parent.replaceChild( replacement, node );	
	
	if ( parent.nodeType === Node.DOCUMENT_FRAGMENT_NODE ) {
		if ( parent.dataset ) parent.dataset.bind += `,${bindingKey}`;
		else parent.dataset = { bind: bindingKey };
	}
	else {
		copyAttribute( parent, bindingKey );
	}
}