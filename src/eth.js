import Context from './Context';
import dom from './template/dom';
import bind from './bind'; 

export default class Eth {
	
	constructor( options ) {
		const { fragment, bindingTree } = options.template;
		const template = dom.getTemplate( fragment, bindingTree );
		const { queue, node } = template.render();
		
		const context = new Context( options.data );
		bind( queue, context );
		
		options.el.appendChild( node );
	}
		
}

Eth.dom = dom;