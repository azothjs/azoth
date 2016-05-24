import bound from '../bindings/bound';

export default function mapDefsToBindings( defs ) {
	if ( !defs ) return;
	return convert( defs );
}

function convert( defs ) {
	return defs.map( def => {
		const definition = def.binder === 'wrap' ? convert( def.wrapped ) : def;
		return bound[ def.binder ]( definition ); 
	});	
}