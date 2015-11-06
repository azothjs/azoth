import TextRenderer from './TextRenderer';
import Context from '../Context';

export default class TextSectionRenderer {
	constructor ( template, index, children ) {
		this.node = '';
		this.hasAttach = true;
		this.index = index;
		this.section =  new TextRenderer( template.content );
		this.ref = template.ref;
	}

	attach ( instance, context ) {
		const section = this.section;
		const value = context.get( this.ref );
		let result = '';

		if ( Array.isArray( value ) ) {
			result = value.map( item => {
				return section.render( new Context( item ) );
			}).join( '' );
		}
		else if ( value ) {
			result = section.render( context );
		}

		instance[ this.index ] = result;
	}
}
