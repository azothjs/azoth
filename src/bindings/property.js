export default function propertyBinding ( binding ) {
	
	const { ref, name } = binding;
	
	return function bindProperty ( context, obj ) {
		obj[ name ] = context.value( ref );
	};
}