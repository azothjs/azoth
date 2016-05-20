import Context from './Context';
import templateRenderer from './templateRenderer';
import Binder from './bindings/Binder';
import bind from './bind'; 
import { makeFragment, clean } from './parser/fragmentUtil'; 
import parser from './parser/parser';
 

export default class Diamond {
	
	constructor( { template, data, el } ) {
		const { fragment, bindings } = template; 
	
		initBindings( fragment, bindings );
		
		const { queue, node } = templateRenderer( fragment, bindings )();
		const context = new Context( data );
		bind( queue, context );
		el.appendChild( node );
	}	
}

function initBindings( fragment, bindings ) {
	const nodes = fragment.querySelectorAll( '[data-bind]' );
	initNodes( nodes, bindings );
}

function initNodes( nodes, bindings ) {
		
	for( var i = 0, l = nodes.length, node, binding; i < l; i++ ) {
		// list = node.dataset.bind.split( ',' );
		node = nodes[i];
		binding = bindings[ node.dataset.bind ];
		if ( binding && binding.init ) {
			binding.init( node );
		}
			
		// for ( var b = 0, bl = list.length, binding; b < bl; b++ ) {
		// 	binding = bindings[ list[b] ];
		// 	if ( binding ) {
		// 		binding.init( node );
		// 	}
		// }
	}	
}


Diamond.parser = parser;
Diamond.Binder = Binder;
Diamond.makeFragment = makeFragment;
Diamond.clean = clean;