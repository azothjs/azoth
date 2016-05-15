import Context from './Context';
import render from './template';
import bound from './bindings/index';
import bind from './bind'; 
import { makeFragment, clean } from './makeFragment'; 
 

export default class Diamond {
	
	constructor( { template, data, el } ) {
		
		const { queue, node } = render( template )();
		
		const context = new Context( data );
		
		bind( queue, context );
		
		el.appendChild( node );
	}	
}

Diamond.bound = bound;
Diamond.makeFragment = makeFragment;
Diamond.clean = clean;