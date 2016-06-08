export class ComponentInvocation {
	constructor( Component, args ) {
		this.Component = Component;
		this.name = Component.name;
		this.arguments = args;
	}
}

export class Component {

	static compile( ...Components ) {
		const Specs = Components.map( c => {
			if ( c.prototype instanceof Component ) return c.spec;
			Object.keys(c)
				.filter( key => c[ key ] instanceof Component )
				.forEach( key => c[ key ] = c[ key ].spec );
			return c;
		});
		return this.template( ...Specs );
	}
	static get spec() {
		return new Proxy( this, { 
			apply: ( ...args ) => new ComponentInvocation( this, args )
		});
	}
}