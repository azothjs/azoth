import DOMTemplate from './DOMTemplate';
import bind from '../../bind';
import blocks from '../../blocks';
import $ from './static';

export default class Section {
	
	constructor ( binding, template ) {
		this.binding = binding;
		
		this.template = new DOMTemplate( 
			template.fragment, 
			template.bindingTree 
		);
		
		const Block = blocks[ binding.type ];
		
		if ( !Block ) throw new Error( `Unrecognized section type ${binding.type}` );

		this.block = new Block();
	}
	
	node () {
		return $.comment( this.binding.type );
	}
	
	bind ( context, anchor ) {
		const template = this.template;
		
		function add( addContext ) {
			const { queue, node } = template.render();
			bind( queue, addContext );
			anchor.parentNode.insertBefore( node, anchor );
		}
		
		this.block.bind( context, this.binding, add );
		
	}
}