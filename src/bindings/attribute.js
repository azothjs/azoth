export default function attributeBinding ( binding ) {
	
	const { ref, name } = binding;
	
	return function bindAttribute ( context, element ) {
		element.setAttribute( name, context.get( ref ) );
	};
}