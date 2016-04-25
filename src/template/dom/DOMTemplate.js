import getBindings from '../getBindings';
// import queueBindings from '../queueBindings';
import getBindingTree from '../../getBindingTree';

export default class DOMTemplate {
	
	constructor ( fragment, bindingTree = getBindingTree( fragment.childNodes ) ) {
		this.fragment = fragment;
		this.bindingTree = bindingTree;
		
		// console.log( JSON.stringify(bindingTree, true, 2) );
	}
	
	node () {
		return document.createDocumentFragment();
	}
	
	render() {
		const node = this.fragment.cloneNode( true );
		
		// array of { node, binder }
		const queue = getBindings( node, this.bindingTree )
		
		return { node, queue };
	}
}