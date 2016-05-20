export default function attributeBinding ( name, binding ) {
	
	const ref = binding.ref;
	
	return function bindAttribute ( context, element ) {
		element.setAttribute( name, context.get( ref ) );
	};
}