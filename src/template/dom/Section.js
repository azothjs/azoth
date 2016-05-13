import DOMTemplate from './DOMTemplate';
import bind from '../../bind';
import blocks from '../../blocks';
import $ from './static';

export default class Section {
	
	constructor ( binding, template ) {
		this.binding = binding;
		
		this.template = new DOMTemplate( template );
		
		const Block = blocks[ binding.type ];
		
		if ( !Block ) throw new Error( `Unrecognized section type ${binding.type}` );

		this.block = new Block();
	}
	
	node () {
		return $.comment( this.binding.type );
	}
	
	bind ( context, node ) {
		const template = this.template;
		const anchor = this.node();
		
		node.parentNode.replaceChild( anchor, node );
		
		function add( addContext ) {
			const { queue, node } = template.render();
			bind( queue, addContext );
			anchor.parentNode.insertBefore( node, anchor );
		}
		
		this.block.bind( context, this.binding, add );
		
	}
}