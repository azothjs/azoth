
export default class Context {
	constructor ( data ) {
		this.data = data;
	}

	get ( ref ) {
		return this.data[ref];
	}
}
