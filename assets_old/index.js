
function fragment() {
	return document.createDocumentFragment();
}
function comment( comment) {
	return document.createComment( comment );
}
function el( text ) {
	const div = document.createElement( 'DIV' );
	div.textContent = text;
	return div;
}

const frag1 = fragment();
frag1.appendChild( el( 'one' ) );
const section = comment( 'section each' );
frag1.appendChild( section );
const before = el( 'two' );
frag1.appendChild( before );

const frag2 = fragment();
frag2.appendChild( el( 'foo' ) );

const frag = frag1.cloneNode( true );
frag.insertBefore( frag2.cloneNode( true ), null /*frag.children[1]*/ );

document.body.appendChild( frag );



