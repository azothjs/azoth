import childNodesRenderer from './children/childNodes';

export default function sectionRenderer( template, index ) {
	const node = document.createComment( `section ${index} anchor` );
	const frag = document.createDocumentFragment();
	const binder = getBinder( frag, template, index );
	return { node, binder };
}

function getBinder( fragment, template, index ) {
	if ( !template || !template.length ) return;

 	const children = childNodesRenderer( template, n => fragment.appendChild(n) );

	return function* bind( context ) {
		const anchor  = yield index;
		const parentNode = anchor.parentNode;
		const clone = fragment.cloneNode( true );
		if ( children ) {
			children( context, i => clone.childNodes[i] );
		}
		parentNode.insertBefore( clone, anchor );
	};
}
