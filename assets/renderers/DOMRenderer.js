import DOMElementRenderer from './DOMElementRenderer';
import DOMAttributeRenderer from './DOMAttributeRenderer';
import DOMTextRenderer from './DOMTextRenderer';
import DOMSectionRenderer from './DOMSectionRenderer';
import getRenderers from './getRenderers';

const getRenderer = getRenderers({
	element: DOMElementRenderer,
	text: DOMTextRenderer,
	section: DOMSectionRenderer,
	attribute: DOMAttributeRenderer
});

const defaultOptions = { isRoot: false };

export default class DOMRenderer {

	constructor( template ) {
		const frag = this.fragment = document.createDocumentFragment();
		const renderers = this.renderers = [];
		template.forEach( ( item, index ) => {
			const renderer = getRenderer( item, index );
			if( renderer.node ) frag.appendChild( renderer.node );
			if( renderer.hasAttach ) renderers.push( renderer );
		});
	}

	render( context, options = defaultOptions ) {
		const instance = options.isRoot ? instance :this.fragment.cloneNode( true );
		this.renderers.forEach( r => r.attach( instance, context ) );
		return instance;
	}
}

