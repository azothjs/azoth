import { read } from './read';

export default function* getItem ( template ) {
	const { node, bind } = read( template );
	const index = yield node;

	if ( !bind ) return;

	return function* ( context ) {
		const instance = yield index;
		return bind( context, instance );
	};
}

export default function childNodesRenderer ( children, append ) {
	if ( !children ) return;

	const items = children.map( getItem );
	items.map( i => i.next( append( i.next() ) ), i.return() );



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



