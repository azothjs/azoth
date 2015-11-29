import Context from '../Context';

export default class Section {
	constructor ( template, Renderer ) {
		this.ref = template.ref;
		this.hasAttach = true;
		// TODO: rename .content --> .children
		this.section = new Renderer( template.content );
	}

	assign ( context, fn ) {
		const section = this.section;
		const value = context.get( this.ref );

		if ( Array.isArray( value ) ) {
			value.forEach( item => {
				fn( section.render( new Context( item ) ) );
			});
		}
		else if ( value ) {
			fn( section.render( context ) );
		}
	}

	attach ( instance, context ) {}
}
