
export default function getRenderers( types ) {

	return function getRenderer( template, index ) {

		const children = template.children ? template.children.map( getRenderer ) : null

		const Renderer = types[ template.type || 'default' ];

		if ( !Renderer ) {
			throw `Unsupported renderer type: "${template.type}"`;
		}

		return new Renderer( template, index, children );
	};
}
