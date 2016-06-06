export default function attributeBinding ( { name, ref } ) {
	
	return ( element, context ) => {
		element.setAttribute( name, context.value( ref ) );
	};
}