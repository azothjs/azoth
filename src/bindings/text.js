export default function textBinding ( { ref } ) {
	
	return ( context, node ) => {
		node.textContent = context.value( ref );
	};
	
}