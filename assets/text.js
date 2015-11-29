export default function textRenderer( template, index = 0 ) {
	const { text } = template;
	const node = document.createTextNode( text );
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
