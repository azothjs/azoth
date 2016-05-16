import Context from './Context';
import makeRender from './makeRender';
import bound from './bindings/index';
import bind from './bind'; 
import { makeFragment, clean } from './parser/fragmentUtil'; 
import parser from './parser/parser';
 

export default class Diamond {
	
	constructor( { template, data, el } ) {
		
		const { queue, node } = makeRender( template )();
		
		const context = new Context( data );
		
		bind( queue, context );
		
		el.appendChild( node );
	}	
}

Diamond.parser = parser;
Diamond.bound = bound;
Diamond.makeFragment = makeFragment;
Diamond.clean = clean;