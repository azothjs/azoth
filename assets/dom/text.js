export default function textRenderer( template, index ) {

	const node = document.createTextNode( template.text );
	const binder = getBinder( template, index );

	return { node, binder };
}

function getBinder( template, index ){
	if ( !template.ref ) return;

	return function* bind( context ) {
		const instance  = yield index;
		instance.textContent = context.get( template.ref );
	};
}
