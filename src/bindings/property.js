export default function propertyBinding ( { name, ref } ) {
	
	return ( obj, context ) => {
		obj[ name ] = context.value( ref );
	};
}