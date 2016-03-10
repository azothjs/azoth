import render from './render';
import Context from './Context';

function queueRenderer( queue, renderer ) {
	const renderers = queue.renderers;
	if ( !renderers ) queue.renderers = [ renderer ];
	else renderers.push( renderer );
}

function appendChildren( node, children, queue ) {
	const mapChildren = queue.children || ( queue.children = [] );
	var childqueue, child;
	for ( let i = 0, l = children.length; i < l; i++ ) {
		mapChildren.push( childqueue = { index: i } );
		child = create( children[i], childqueue );
		node.appendChild( child );
	}
}

export default function create( template, queue ){
	
	if ( template.type === 'section' ) {
		return createSection( template, queue );
	}
	else {
		
		const { node, renderer } = getItem( template );
		
		if ( renderer ) {
			queueRenderer( queue, renderer );
		}
		
		const children = template.children;
		
		if ( children ) {
			appendChildren( node, children, queue );
		}
		
		return node;
	}
	
}

function createSection( template, queue ){
	const { node, renderer, fragment, childqueue } = getSection( template );
	
	if ( renderer ) {
		queueRenderer( queue, renderer );
	}
	
	const children = template.children;
	
	if ( children ) {
		appendChildren( fragment, children, childqueue );
	}	
	
	return node;
}

function getItem( template ) {
	const { type, name, ref } = template;
	
	if ( !type ) return { node: document.createDocumentFragment() };
	
	let node, renderer;
	
	switch( type ) {
		case 'element':
			node = document.createElement( name );
			break;
		// case 'section':
		// 	break;
		case 'text':
			node = document.createTextNode( template.text || '' );
			if ( ref ) renderer = ( context, node ) => {
				node.textContent = context.get( ref );
			};
			break;
		default: 
			throw new Error( `Unexpected template type "${type}"` );
	}
	
	return { node, renderer };
	
}

function getSection( template ) {
	const { subtype = '', ref } = template;
	
	const node = document.createComment( subtype || 'section' );
	const fragment = document.createDocumentFragment();
	const childqueue = {};
	
	function add( context, node ){
		const clone = render( fragment, childqueue, context );
		node.parentNode.insertBefore( clone, node );
	}
	
	let renderer;
	
	switch( subtype ) {
		case '':
			renderer = add;
			break;
		case 'for':
			renderer = ( context, node ) => {
				const value = ref ? context.get( ref ) : void 0;
				if ( Array.isArray( value ) ) {
					for ( var i = 0, l = value.length; i < l; i++ ) {
						add( new Context( value[i] ), node );
					}
				}
			};
			break;
		case 'if':
			renderer = ( context, node ) => {
				const value = ref ? context.get( ref ) : void 0;
				if ( value ) add( context, node );
			};
			break;
		case 'with':
			renderer = ( context, node ) => {
				const value = ref ? context.get( ref ) : void 0;
				if ( value != null ) add( new Context( value ), node );
			};
			break;
		default: 
			throw new Error( `Unexpected section subtype "${subtype}"` );
	}
	
	return { node, renderer, fragment, childqueue };
	
}