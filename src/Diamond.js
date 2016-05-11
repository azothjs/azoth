import Context from './Context';
import dom from './template/dom';
import bind from './bind'; 
import makeFragment from './makeFragment'; 

export default class Diamond {
	
	constructor( { template, data, el } ) {
		
		const domTemplate = dom.getTemplate( template );
		
		const { queue, node } = domTemplate.render();
		
		const context = new Context( data );
		
		bind( queue, context );
		
		el.appendChild( node );
	}
		
}

Diamond.dom = dom;
Diamond.makeFragment = makeFragment;