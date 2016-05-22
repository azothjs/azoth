import Context from './Context';
import templateRenderer from './templateRenderer';
import bound from './bindings/bound';
import { makeFragment, clean } from './parser/fragmentUtil'; 
// import parser from './parser/parser';

export default class Diamond {
	
	constructor( { template, data, el } ) {
		const context = new Context( data );
		const node = templateRenderer( template )( context );
		el.appendChild( node );
	}	
}


// Diamond.parser = parser;
Diamond.bound = bound;
Diamond.makeFragment = makeFragment;
Diamond.clean = clean;