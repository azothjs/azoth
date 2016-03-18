import render from './render';
import Context from './Context';
import BindingTree from './BindingTree';

function queueRenderer( queue, renderer ) {
	queue.renderers.push( renderer );
}

export default function create( template, queue ){
	
	const item = getItem( template );
	const { node, renderer } = item; 
	
	if ( renderer ) {
		queueRenderer( queue, renderer );
	}
	
	var parent, childqueue;
	
	if ( template.type === 'section' ) {
		const section = createSection( template, queue );
		parent = section.node;
		childqueue = section.queue;
	}
	else {
		parent = node;
		childqueue = queue;
	}
	
	const children = template.children;
	
	if ( children ) {
		appendChildren( parent, children, childqueue );
	}

	return node;
}

function appendChildren( node, children, queue ) {
	var childqueue, child;
	for ( let i = 0, l = children.length; i < l; i++ ) {
		childqueue = queue.createChild( i );
		child = create( children[i], childqueue );
		node.appendChild( child );
	}
}

function createSection( template, queue ) {
	const { renderer, fragment, childqueue } = getSection( template );
	
	if ( renderer ) {
		queueRenderer( queue, renderer );
	}
	
	return { node: fragment, queue: childqueue };
}

function getItem( template ) {
	const { type, name, ref } = template;
	
	if ( !type ) return { node: document.createDocumentFragment() };
	
	let node, renderer;
	
	switch( type ) {
		case 'element':
			node = document.createElement( name );
			break;
		case 'section':
			node = document.createComment( template.subtype || 'section' )
			break;
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
	
	// const node = document.createComment( subtype || 'section' );
	const fragment = document.createDocumentFragment();
	const childqueue = new BindingTree();
	
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
	
	return { renderer, fragment, childqueue };
	
}