export default class DOMTextRenderer {
	constructor ( template, index, children ) {
		this.node = document.createTextNode( template.text );
		this.ref = template.ref;
		this.hasAttach = !!template.ref;
		this.index = index;
	}

	attach ( instance, context ) {
		instance.childNodes[ this.index ].textContent = context.get( this.ref );
	}
}
