export class Context{
	
	static get( options ) {
		const context = new Context( options );
		return getProxy( context );
	}

	constructor( { prop = '.', parent = null } = {} ){
		this.prop = prop;
		this.parent = parent;
		this.children = Object.create( null );
	}
	
	map( map ) {
		const section = new Section( map );
		const binding = { 
			ref: this.prop,
			type: 'map',
			template: section.template
		};
		return new Mapping( binding );
	}

	getPath() {
		const paths = [ this.prop ];
		let parent = this;
		while( parent = parent.parent ) {
			const prop = parent.prop;
			if ( prop !== '.' ) paths.push( prop );
		}
		return paths.length > 1 ? paths : paths[0];
	}
	
	
	getChildContext( name ) {
		let child = this.children[ name ];
		if ( !child ) {
			// TODO: `this` probably needs passed as parent
			// extended keypaths, etc... 
			child = Context.get({ prop: name, parent: this });
			this.children[ name ] = child; 
		}
		return child;
	}
}
	
export class Section extends Context {
	constructor( render ) {
		super();
		this.render = render;
		this.template = render( this );
		this.name = '';
	}
}

// TODO: throw error via Proxy if property accessed
export class Mapping {
	constructor( binding ) {
		this.binding = binding;
	}
}

function getProxy( context ){
	
	const handler = {
		get( target, name ){
			if ( name in target ) return target[name];
			
			return target.getChildContext( name );
		}
		//,
		//TODO: possibly for direct invocation without fat arrow
		// apply( target, thisArg, argumentsList ) {
		// 	console.log( target, thisArg, argumentsList );
		// 	return () => {};
		// }
	};

	return new Proxy( context, handler );
}

