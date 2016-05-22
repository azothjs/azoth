import bound from '../bindings/bound';

export default function mapDefsToBindings( defs ) {
	if ( !defs ) return;
	return convert( defs );
}

function convert( defs ) {
	return defs.map( def => {
		// if ( def.template ) {
		// 	def.template = convert( def.defs );
		// }
		return bound[ def.binder ]( def );
	});	
}