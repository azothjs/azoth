import TextElementRenderer from './TextElementRenderer';
import TextTextRenderer from './TextTextRenderer';
import TextSectionRenderer from './TextSectionRenderer';
import getRenderers from './getRenderers';

const getRenderer = getRenderers({
	element: TextElementRenderer,
	text: TextTextRenderer,
	section: TextSectionRenderer
});

const defaultOptions = { isRoot: false };

export default class TextRenderer {

	constructor( template ) {
		const out = this.out = new Array( template.length );
		const renderers = this.renderers = [];
		template.forEach( ( item, index ) => {
			const renderer = getRenderer( item, index );
			out[ index ] = renderer.node;
			if( renderer.hasAttach ) renderers.push( renderer );
		});
	}

	render( context, options = defaultOptions ) {
		const instance = options.isRoot ? out : this.out.slice();
		this.renderers.forEach( r => r.attach( instance, context ) )
		return instance.join( '' );
	}
}
