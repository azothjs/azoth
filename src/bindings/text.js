export default function textBinding ( { ref } ) {
	
	return ( node, context ) => {
		node.textContent = context.value( ref );
	};
	
}