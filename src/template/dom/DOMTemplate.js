import getBindings from '../getBindings';
// import queueBindings from '../queueBindings';
import getBindingTree from '../../getBindingTree';

export default class DOMTemplate {
	
	constructor ( { fragment, bindings } ) {
		this.fragment = fragment;
		this.bindings = bindings;
	}
	
	node () {
		return document.createDocumentFragment();
	}
	
	render() {
		const node = this.fragment.cloneNode( true );
		const queue = this.bindings( node );
		return { node, queue };
	}
}