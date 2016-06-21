const acorn = require( 'acorn' );

export default function getTagged( source ) {
	
	const ast = acorn.parse( source, {
		ecmaVersion: 7,
		preserveParens: true,
		sourceType: 'module'
	});

	const results = [];
	find( ast.body );
	return results;

	function find( nodes ) {
		if ( !Array.isArray( nodes ) ) nodes = [ nodes ];

		nodes.forEach( node => {
			if( node.type === 'TaggedTemplateExpression' && node.tag.name === '$' ) {
				results.push( node );
			}
			if( node.expression ) find( node.expression );
			if( node.declarations ) find( node.declarations );
			if( node.body ) find( node.body );
			if( node.init ) find( node.init.body );
		});
	}
}