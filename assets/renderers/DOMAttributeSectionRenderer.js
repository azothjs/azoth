import DOMRenderer from './DOMRenderer';
import Context from '../Context';

export default class DOMAttributeSectionRenderer {
	constructor ( template, index, children ) {
		this.node = null;
		this.hasAttach = true;
		this.index = index;
		this.section =  new DOMRenderer( template.content );
		this.ref = template.ref;
	}

	attach ( instance, context ) {
		const section = this.section;
		const before = instance.childNodes[ this.index ];
		const value = context.get( this.ref )

		if ( Array.isArray( value ) ) {
			value.forEach( item => {
				instance.insertBefore( section.render( new Context(item) ), before );
			});
		}
		else if ( value ) {
			instance.insertBefore( section.render( context ), before );
		}
	}
}
