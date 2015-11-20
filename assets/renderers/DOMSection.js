import DOMRenderer from './DOMRenderer';
import Section from './Section';

export default class DOMSection extends Section {

	constructor ( template, index ) {
		super( template, DOMRenderer );
		this.node = document.createComment( `section ${index} anchor` );
		this.index = index;
	}

	attach ( instance, context ) {
		const before = instance.childNodes[ this.index ];
		this.assign( context, item => {
			instance.insertBefore( item, before );
		});
	}
}
