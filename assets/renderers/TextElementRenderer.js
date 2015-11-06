
export default class TextElementRenderer {
	constructor ( template, index, children ) {

		this.node = '';
		this.name = template.name;
		this.index = index;
		this.hasAttach = true;
		this.children = null;
		this.childContent = null;

		if ( children ) {
			const childContent = this.childContent = new Array( children.length );
			const renderers = [];
			children.forEach( ( child, index ) => {
				childContent[ index ] = child.node;
				if ( child.hasAttach ) renderers.push( child );
			});

			if ( renderers.length ) {
				this.children = renderers;
			}
		}
	}

	attach ( instance, context ) {
		const children = this.children,
			  childContent = this.childContent;

		if ( children ) {
			this.children.forEach( child => child.attach( childContent, context ) );
		}
		const contents = childContent ? childContent.join( '' ) : '';

		const name = this.name;
		instance[ this.index ] = `<${name}>${contents}</${name}>`;

	}
}
