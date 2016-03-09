export default class Context {
	constructor ( data ) {
		this.data = data;
	}

	get ( ref ) {
		return ref === '.' ? this.data : this.data[ ref ];
	}
}
