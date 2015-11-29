export default function attributeRenderer( template, name ) {

	const attr = document.createAttribute( name );
	const binder = getBinder( template );

	if ( !binder ) {
		attr.nodeValue = template.text;
	}

	return { attr, binder };
}

function getBinder( template, name ){
	if ( !template.ref ) return;

	return function bind( element, context ) {
		element.setAttribute( name, context.get( template.ref ) );
	};
}



