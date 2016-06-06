export default function childTextBinding ( { index = 0, ref } ) {
	
	return ( node, context ) => {
		node.childNodes[ index ].nodeValue = context.value( ref );
	};
	
}