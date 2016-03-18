import { getAttribute } from './getChild';

export default function attributesRenderer ( attributes, append ) {
	if ( !attributes ) return;

	let binders = null;

	const names = Object.keys( attributes );
	names.forEach( name => {
		// TODO: allow attribute sections
		const renderer = getAttribute( 'attribute' );
		const r = renderer( attributes[name], name );
		append( r.attr );

		const binder = r.binder;
		if ( binder ) {
			if ( !binders ) binders = [ r.binder ];
			else binders.push( r.binder );
		}
	});

	return getBinder( binders );
}

function getBinder( binders ) {
	if ( !binders ) return;

	return function bind ( context, getInstance ){
		binders
			.map( b => b( context ) )
			.map( g => ( { g, i: getInstance( g.next().value ) } ) )
			.forEach( e => e.g.next( e.i ) );
	};
}


