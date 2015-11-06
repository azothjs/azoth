export default class DOMAttributeRenderer {

	constructor ( template, index, children ) {
		this.node = null;
		const isStatic = !( this.hasAttach = !!( this.ref = template.ref ) );
		this.index = index;
		this.name = template.name;

		if ( isStatic ) {
			const attr = this.node = document.createAttribute( template.name );
			attr.nodeValue = template.text;
		}
	}

	attach ( instance, context ) {
		instance.setAttribute( this.name, context.get( this.ref ) );
	}
}
