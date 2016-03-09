// import attributesRenderer from '../children/attributes';
import { getChildren } from '../children/childNodes';

export default class ElementRenderer {

	constructor ( template, index = 0 ) {
		this.name = template.name;
		this.index = index;
		this.children = template.children;
		this.isBound = false;
		this.renderers = null;
	}

	create () {
		const element = document.createElement( this.name );
		this.isBound = !!(
			this.renderers = getChildren( element, this.children )
		);

		return element;
	}

	render ( childNodes ) {
		const element = childNodes[ this.index ];
		const renderers = this.renderers;

		if ( !renderers ) return;

		return ( context ) => {
			renderers.render( element.childNodes, context );
		};
	}
}

