import render from './render';
import Context from './Context';

export default function create( template, queue, index = 0 ){
	const { node, renderer, parent = node, childqueue } = createTemplate( template );
	
	if ( renderer ) {
		const q = queue[ index ] || ( queue[ index ] = { fn: [] } );
		q.fn = q.fn || [];
		q.fn.push( renderer );
	}
	
	const children = template.children;
	
	if ( children ) {
		if ( childqueue ) {
			const q = queue[ index ] || ( queue[ index ] = {} );
			q.child = childqueue;
			queue = childqueue;
		}
		
		const childQueue = queue[ index ] = {};
		for( let i = 0, l = children.length; i < l; i++ ) {
			parent.appendChild( create( children[i], childQueue, i ) );
		}
	}
	
	return node;
}

function createTemplate( template ) {
	const { type, name, ref } = template;
	
	if ( !type ) return { node: document.createDocumentFragment() };
	
	if ( type === 'section') return createSection( template );
	
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

function createSection( template ) {
	const { subtype = '', ref } = template;
	
	const node = document.createComment( subtype || 'section' );
	const parent = document.createDocumentFragment();
	const childqueue = {};
	
	function add( context, node ){
		const clone = render( parent, childqueue, context );
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
					value.forEach( item => add( new Context( item ), node ) );
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
	
	return { node, renderer, parent, childqueue };
	
}