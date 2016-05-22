export default function childTextBinding ( binding ) {
	
	const ref = binding.ref;
	const index = binding.index || 0;
	
	return ( context, node ) => {
		node.childNodes[ index ].nodeValue = context.value( ref );
	};
	
}