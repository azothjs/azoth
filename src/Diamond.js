import Context from './Context';
import renderer from './renderer';
import bound from './bindings/bound';
import { makeFragment, clean } from './parser/domUtil'; 
import parser from './parser/parser';

export default class Diamond {
	
	constructor( { template, el, data = {} } ) {
		const context = this.context = new Context( data );
		const node = renderer( template )( context );
		el.appendChild( node );
	}	
}


Diamond.parser = parser;
Diamond.bound = bound;
Diamond.makeFragment = makeFragment;
Diamond.clean = clean;