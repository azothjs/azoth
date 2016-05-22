export default function attributeBinding ( { name, ref } ) {
	
	return ( context, element ) => {
		element.setAttribute( name, context.value( ref ) );
	};
}