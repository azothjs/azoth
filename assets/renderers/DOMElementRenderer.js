import DOMAttributeRenderer from './DOMAttributeRenderer';
import DOMSectionRenderer from './DOMSectionRenderer';
import getRenderers from './getRenderers';

const getRenderer = getRenderers({
	attribute: DOMAttributeRenderer,
	section: DOMSectionRenderer
});

export default class DOMElementRenderer {
	constructor ( template, index, children ) {

		const node = this.node = document.createElement( template.name );
		this.index = index;
		this.hasAttach = false;
		this.children = null;
		this.attributes = null;

		if ( template.attributes ) {
			const attributes = [];
			template.attributes
				.map( getRenderer )
				.forEach( attr => {
					if ( attr.node ) node.setAttributeNode( attr.node );
					if ( attr.hasAttach ) attributes.push( attr );
				});

			if ( attributes.length ) {
				this.hasAttach = true;
				this.attributes = attributes;
			}
		}

		if ( children ) {
			const renderers = [];
			children.forEach( child => {
				if ( child.node ) node.appendChild( child.node );
				if ( child.hasAttach ) renderers.push( child );
			});

			if ( renderers.length ) {
				this.hasAttach = true;
				this.children = renderers;
			}
		}
	}

	attach ( instance, context ) {
		const node = instance.childNodes[ this.index ];
		attach( this.attributes, node, context );
		attach( this.children, node, context );
	}
}

function attach( children, node, context ) {
	if ( !children ) { return; }
	children.forEach( child => child.attach( node, context ) );
}
