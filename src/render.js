import renderer from './renderer';

export default function render ( { template, el, context, owner } ) {
	const render = renderer( template );
	const node = render( context, owner );
	el.appendChild( node );
}