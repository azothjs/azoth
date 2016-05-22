export default function propertyBinding ( { name, ref } ) {
	
	return ( context, obj ) => {
		obj[ name ] = context.value( ref );
	};
}