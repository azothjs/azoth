export default function textBinding ( binding ) {
	
	const ref = binding.ref;
	const index = binding.index || 0;
	
	return ( context, node ) => {
		node.childNodes[ index ].textContent = context.get( ref );
	};
	
}