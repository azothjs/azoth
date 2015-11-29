import TextRenderer from './TextRenderer';
import Section from './Section';

export default class TextSection extends Section {
	constructor ( template, index ) {
		super( template, TextRenderer );
		this.node = '';
		this.index = index;
	}

	attach ( instance, context ) {
		let result = '';
		this.assign( context, item => {
			result += item;
		});
		instance[ this.index ] = result;
	}
}
