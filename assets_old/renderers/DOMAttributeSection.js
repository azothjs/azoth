import DOMAttributesRenderer from './DOMAttributesRenderer';
import Section from './Section';

export default class DOMAttributeSection extends Section {

	constructor ( template, index ) {
		super( template, DOMAttributesRenderer );
		this.index = index;
	}

	attach ( element, context ) {
		this.assign( context, attributes => {
			attributes
				.addTo( element )
				.forEach( attr => {
					attr.attach( element, context );
				});
		});
	}
}
