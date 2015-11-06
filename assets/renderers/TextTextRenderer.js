export default class TextTextRenderer {
	constructor ( template, index, children ) {
		this.node = template.text;
		this.ref = template.ref;
		this.hasAttach = !!template.ref;
		this.index = index;
	}

	attach ( instance, context ) {
		instance[ this.index ] = context.get( this.ref );
	}
}
