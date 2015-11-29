import { getAttributeRenderer } from './getRenderers';

const defaultOptions = { isRoot: false };

export default class DOMAttributesRenderer {

	constructor ( template ) {
		this.attributes = template.map( getAttributeRenderer );
	}

	render () {
		return this;
	}

	addTo ( element ) {
		const attributes = this.attributes;

		attributes.forEach( attr => {
			// add the attr to the element so it will
			// be including on fragment.clone()
			if ( attr.node ) element.setAttributeNode( attr.node );
		});

		// post attach work by attr or section
		return attributes.filter( attr => attr.hasAttach );
	}
}

