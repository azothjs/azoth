// import Template from '../Template';
import getBindingTree from '../../getBindingTree';
import deepSlice from './deepSlice';

export default class StringTemplate {
	
	constructor ( fragment, bindingTree = getBindingTree( fragment.childNodes ) ) {
		this.fragment = fragment;
		this.bindingTree = bindingTree;
	}
	
	clone() {
		return deepSlice( this.fragment );
	}
	
	getChildren( node ) {
		return node;
	}
	
	render(){}
}