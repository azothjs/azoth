export default class Context {
	constructor ( data ) {
		this.data = data;
	}

	value ( ref ) {
		return ref === '.' ? this.data : this.data[ ref ];
	}
	
	child( ref ) {
		return new Context( this.get( ref ) );
	}
}
