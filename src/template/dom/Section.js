import Binding from '../../Binding';
import Context from '../../Context';
import getBindingTree from '../../getBindingTree';
import render from '../../render';
import blocks from '../../blocks';
import $ from './static';

export default class Section extends Binding {
	
	constructor ( binding, template ) {
		super( binding );
		
		this.template = {
			clone() { return template.clonable.cloneNode( true ) },
			bindingTree: template.bindingTree || getBindingTree( template.clonable.childNodes )
		}
		
		// TODO: raise error on unknown section type
		this.block = new ( blocks[ binding.type ] );
	}
	
	node () {
		return $.comment( this.binding.type );
	}
	
	bind ( context, target ) {
		const anchor = target.node;
		const template = this.template;
		
		function add( addContext ) {
			const clone = render( template, addContext );
			anchor.parentNode.insertBefore( clone, anchor );
		}
		
		this.block.bind( context, this.binding, add );
		
	}
}