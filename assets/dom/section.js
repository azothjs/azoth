import { getChildNode } from '../children/getChild';
import { getChildren } from '../children/childNodes';
import Context from '../Context';

export default class Section {
	constructor ( template, index = 0 ) {
		this.ref = template.ref;
		this.index = index;
		this.isBound = true;
		this.children = template.children;
		this.fragment = null;
		this.renderers = null;
	}

	create () {
		const fragment = this.fragment = document.createDocumentFragment();
		this.renderers = getChildren( fragment, this.children );
		// return a placeholder
		return document.createComment( `section ${this.index} anchor` );
	}

	render ( childNodes ) {
		const anchor = childNodes[ this.index ];
		const parentNode = anchor.parentNode;

		return ( context ) => {
			const ref = this.ref;
			const value = ref ? context.get( this.ref ) : void 0;
			const fragment = this.fragment;
			const renderers = this.renderers;

			if ( !this.ref ) {
				add( context );
			}
			else if ( Array.isArray( value ) ) {
				value.forEach( item => add( new Context( item ) ) );
			}
			else if ( value ) {
				add( value );
			}

			function add( context ){
				const clone = fragment.cloneNode( true );

				if ( renderers ) {
					renderers.render( clone.childNodes, context );
				}

				parentNode.insertBefore( clone, anchor );
			}

		};
	}
}

