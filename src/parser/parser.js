import { makeDiv } from './fragmentUtil'; 

const textMustache = /({{[^#\/].+?}})/g;
const mustacheBrackets = /[{{|}}]/g;
// const anyMustache = /({{.+?}})/g;

const textElName = 'text-node';
const bindingName = 'binding';

export default function parser( template ){
	
	const hash = Object.create( null );
	var i = 0;
	
	template = template.replace( textMustache, match =>  {
		const name = `t${i++}`;
		const ref = match.replace( mustacheBrackets, '' ).trim();
		hash[ name ] = { ref, type: 'text' };
		return `<${textElName}>${name}</${textElName}>`;
	});
	
	// sections
	
	const div = makeDiv( template );

	indexTextBindings( div, hash );
	
	const bindings = rollupBindings( div, hash );
	const html = div.innerHTML.replace( /data-bind=""/g, 'data-bind' );
	
	return { html, bindings };
}

const BINDING_ATTR = 'data-bind';

function rollupBindings( el, namedBindings ) {
	var nodes = el.querySelectorAll( `[${BINDING_ATTR}]` );
	var ordered = [];
	
	for( var i = 0, l = nodes.length, node, bindings; i < l; i++ ) {
		node = nodes[i];
		bindings = node.dataset.bind.split( ',' ).map( n => namedBindings[n] );
		
		if ( !bindings.length ) throw new Error( 'zero length bindings' );
		if ( bindings.length === 1 ) {
			ordered.push( bindings[0] );
		}
		else {
			ordered.push( { type: 'wrap', bindings } );
		}
		node.setAttribute( 'data-bind',  '' );
	}
	
	return ordered;
	
}



function indexTextBindings( element, bindings ) {
	
	[].slice.call( element.querySelectorAll( textElName ) )
		.filter( el => {
			const name = el.textContent;
			const parent = el.parentNode;
			const binding = bindings[ name ];
			el.textContent = null;
			
			
			// add the binding name to the parent element
			var attr = parent.getAttribute( BINDING_ATTR ) || '';
			if ( attr ) attr += ',';
			parent.setAttribute( BINDING_ATTR, attr += name );
			
			const pos = getPosition( el );
			// record non-zero index
			if ( pos ) binding.index = pos;
			
			// assume we can remove the <text-node>
			var remove = true;
			if ( parent.childNodes.length > 1 ) {
				// use childText binding if this is not the only childNode
				binding.type = 'childText';
				remove = false;
			}
			
			return remove;
			
				
		})
		// remove the elements from the dom
		.forEach( el => el.parentNode.removeChild( el ) );
}

function getPosition( el ) {
	var i = 0, prev = el;
	while( prev = prev.previousSibling ) i++;
	return i;
}