import Binding from '../../Binding';
import Context from '../../Context';
import getBindingTree from '../../getBindingTree';
import render from '../../render';
import blocks from '../../blocks';
import $ from './static';
import deepSlice from './deepSlice';

export default class StringSection extends Binding {
	
	constructor ( binding, template ) {
		super( binding );
		
		this.template = {
			clone() { return deepSlice( template.clonable ) },
			bindingTree: template.bindingTree || getBindingTree( template.clonable )
		}
		
		// TODO: raise error on unknown section type
		this.block = new ( blocks[ binding.type ] );
	}
	
	node () {
		return [];
	}
	
	bind ( context, target ) {
		const anchor = target.node;
		const template = this.template;
		
		function add( addContext ) {
			const clone = render( template, addContext );
			target.node.push( clone );
		}
		
		this.block.bind( context, this.binding, add );
		
	}
}