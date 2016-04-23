import Context from './Context';
import dom from './template/dom';
import bind from './bind'; 

export default class Diamond {
	
	constructor( { template, data, el } ) {
		
		console.time('template')
		const { fragment, bindingTree } = template;
		const rendered = dom.getTemplate( fragment, bindingTree );
		console.timeEnd('template')
		
		console.time('render');
		const { queue, node } = rendered.render();
		console.timeEnd('render')
		
		console.time('bind');
		const context = new Context( data );
		bind( queue, context );
		console.timeEnd('bind');
		
		console.time('append');
		el.appendChild( node );
		console.timeEnd('append');
	}
		
}

Diamond.dom = dom;