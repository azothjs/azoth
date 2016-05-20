export default function propertyBinding ( name, binding ) {
	
	const ref = binding.ref;
	
	return function bindProperty ( context, obj ) {
		obj[ name ] = context.get( ref );
	};
}