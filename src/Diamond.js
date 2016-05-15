import Context from './Context';
import Template from './Template';
import bound from './bindings/index';
import bind from './bind'; 
import { makeFragment, clean } from './makeFragment'; 
 

export default class Diamond {
	
	constructor( { template, data, el } ) {
		
		const domTemplate = new Template( template );
		
		const { queue, node } = domTemplate.render();
		
		const context = new Context( data );
		
		bind( queue, context );
		
		el.appendChild( node );
	}
		
}

Diamond.bound = bound;
Diamond.makeFragment = makeFragment;
Diamond.clean = clean;