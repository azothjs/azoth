import { getTextRenderer } from './getRenderers';

const defaultOptions = { isRoot: false };

export default class TextRenderer {

	constructor( template ) {
		const out = this.out = new Array( template.length );
		const renderers = this.renderers = [];
		template.forEach( ( item, index ) => {
			const renderer = getTextRenderer( item, index );
			out[ index ] = renderer.node;
			if( renderer.hasAttach ) renderers.push( renderer );
		});
	}

	render( context, options ) {
		options = options || defaultOptions;
		const instance = options.isRoot ? out : this.out.slice();
		this.renderers.forEach( r => r.attach( instance, context ) );
		return instance.join( '' );
	}
}
