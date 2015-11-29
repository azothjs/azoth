import attributesRenderer from '../children/attributes';
import childNodesRenderer from '../children/childNodes';

export default function elementRenderer( template, index ) {
	const node = document.createElement( template.name );
	const binder = getBinder( node, template, index );
	return { node, binder };
}

function getBinder( node, template, index ){
	const childTemplates = template.children;
	const attributes = template.attributes;
	if ( !childTemplates && !attributes ) return;

	const children = childNodesRenderer( childTemplates, n => node.appendChild(n) );
	const attrs = attributesRenderer( attributes, a => node.setAttributeNode(a) );

	if ( !children && !attrs ) return;

	return function* bind( context ) {
		const instance  = yield index;
		if ( attrs ) attrs( instance, context );
		if ( children ) children( context, i => instance.childNodes[i] );
	};
}

