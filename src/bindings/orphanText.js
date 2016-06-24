export default function orhpanTextBinding ( { index = 0, ref } ) {
	
	return ( node, context ) => {
		node.childNodes[ index ].nodeValue = context.value( ref );
	};
	
}