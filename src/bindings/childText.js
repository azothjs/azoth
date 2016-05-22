export default function childTextBinding ( { index = 0, ref } ) {
	
	return ( context, node ) => {
		node.childNodes[ index ].nodeValue = context.value( ref );
	};
	
}