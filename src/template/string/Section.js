import Binding from '../../Binding';
import Context from '../../Context';
import StringTemplate from './StringTemplate';
import bind from '../../bind';
import blocks from '../../blocks';
import $ from './static';

export default class StringSection extends Binding {
	
	constructor ( binding, template ) {
		super( binding );
		
		this.template = new StringTemplate( 
			template.fragment, 
			template.bindingTree 
		);
		
		const Block = blocks[ binding.type ];
		
		if ( !Block ) throw new Error( `Unrecognized section type ${binding.type}` );

		this.block = new Block();
	}
	
	node () {
		return [];
	}
	
	bind ( context, target ) {
		const anchor = target.node;
		const template = this.template;
		
		function add( addContext ) {
			const { queue, node } = template.render();
			bind( queue, addContext );
			target.node.push( node );
		}
		
		this.block.bind( context, this.binding, add );
		
	}
}