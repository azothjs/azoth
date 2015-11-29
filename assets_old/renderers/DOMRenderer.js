import { getDOMRenderer } from './getRenderers';

const defaultOptions = { isRoot: false };

export default class DOMRenderer {

	constructor( template ) {
		const frag = this.fragment = document.createDocumentFragment();
		const renderers = this.renderers = [];
		template.forEach( ( item, index ) => {
			const renderer = getDOMRenderer( item, index );
			if( renderer.node ) frag.appendChild( renderer.node );
			if( renderer.hasAttach ) renderers.push( renderer );
		});
	}

	render( context, options ) {
		options = options || defaultOptions;
		const instance = options.isRoot ? instance :this.fragment.cloneNode( true );
		this.renderers.forEach( r => r.attach( instance, context ) );
		return instance;
	}
}

