export default class TextRenderer {

	constructor ( template, index = 0 ) {
		this.ref = template.ref;
		this.text = template.text;
		this.index = index;
		this.isBound = !!template.ref;
	}

	create () {
		return document.createTextNode( this.text );
	}

	render ( childNodes ) {
		const instance = childNodes[ this.index ];

		return ( context ) => {
			instance.textContent = context.get( this.ref );
		};
	}
}
