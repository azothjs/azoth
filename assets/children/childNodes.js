import { getChildNode } from './getChild';

export default function childNodesRenderer ( children, append ) {
	if ( !children ) return;

	let binders = null;

	children.forEach( ( child, index ) => {
		const renderer = getChildNode( child.type );
		const r = renderer( child, index );
		append( r.node );

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
	}
}


