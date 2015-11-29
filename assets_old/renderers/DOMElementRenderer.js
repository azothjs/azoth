import { getAttributeRenderer, getDOMRenderer } from './getRenderers';
import DOMAttributesRenderer from './DOMAttributesRenderer';

export default class DOMElementRenderer {
	constructor ( template, index ) {

		const node = this.node = document.createElement( template.name );
		this.index = index;
		this.hasAttach = false;
		this.children = null;
		this.attributes = null;

		if ( template.attributes ) {
			const attributes = new DOMAttributesRenderer( template.attributes );
			const attach = attributes.addTo( node );
			if ( attach.length ) {
				this.hasAttach = true;
				this.attributes = attach;
			}
		}

		if ( template.children ) {
			const renderers = [];
			template.children
				.map( getDOMRenderer )
				.forEach( child => {
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
