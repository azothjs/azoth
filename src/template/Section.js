import Template from './Template';
import bind from '../bind';
import blocks from '../blocks';

export default class Section {
	
	constructor ( binding, template ) {
		this.binding = binding;
		
		this.template = new Template( template );
		
		const Block = blocks[ binding.type ];
		
		if ( !Block ) throw new Error( `Unrecognized section type ${binding.type}` );

		this.block = new Block();
	}
	
	bind ( context, node ) {
		const { template, binding } = this;
		const anchor = document.createComment( binding.type );
		
		node.parentNode.replaceChild( anchor, node );
		
		function add( addContext ) {
			const { queue, node } = template.render();
			bind( queue, addContext );
			anchor.parentNode.insertBefore( node, anchor );
		}
		
		this.block.bind( context, binding, add );
		
	}
}