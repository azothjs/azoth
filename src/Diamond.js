import Context from './Context';
import dom from './template/dom';
import bind from './bind'; 

export default class Diamond {
	
	constructor( { template, data, el } ) {
		
		const { fragment, bindingTree } = template;
		const rendered = dom.getTemplate( fragment, bindingTree );
		
		const { queue, node } = rendered.render();
		
		const context = new Context( data );
		bind( queue, context );
		
		el.appendChild( node );
	}
		
}

Diamond.dom = dom;