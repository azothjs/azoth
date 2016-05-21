import Context from './Context';
import templateRenderer from './templateRenderer';

import { Binder, bound } from './bindings/Binder';
import { makeFragment, clean } from './parser/fragmentUtil'; 
import parser from './parser/parser';
 

export default class Diamond {
	
	constructor( { template, data, el } ) {
		const fragment = template.fragment;
		const bindings = template.bindings; 
		const context = new Context( data );
		
		const node = templateRenderer( fragment, bindings )( context );

		el.appendChild( node );
	}	
}


Diamond.parser = parser;
Diamond.bound = bound;
Diamond.Binder = Binder;
Diamond.makeFragment = makeFragment;
Diamond.clean = clean;