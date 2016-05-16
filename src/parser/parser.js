import { makeFragment, makeDiv } from './fragmentUtil'; 

export default function parser( template ){
	const div = makeDiv( template );
	
	const bindings = getTextBindings( div );
	
	return { html: div.innerHTML, bindings };
}

var regex = /({{.+?}})/g;

function getTextBindings( element, bindings = {} ) {
	
	var i = 1;
	textBindings( element );
	return bindings;
	
	function textBindings( element ) {
		const { childNodes } = element;
		
		for( var n = 0, child, matches, value, binding; n < childNodes.length; n++ ) {
			child = childNodes[n];
			if( child.nodeType === 3 ) {
				value = child.nodeValue;
				matches = value.match( regex );
				
				if ( matches ) {
					matches.forEach( m => {
						const index = value.indexOf( m );
						value = value.replace( m, '' );
						const prop = `t${i++}`;
						const ref = m.replace(/[{{|}}]/g, '').trim();
						
						binding = { ref };
						if ( index ) binding.index = index;
						bindings[ prop ] = binding;
						
						element._bindings = element._bindings || [];
						element._bindings.push( prop )
					});
					child.nodeValue = value;
				}
			}
			else if( child.nodeType === 1 ) {
				textBindings( child, bindings );
			}
		}
		
		if ( element._bindings ) {
			element.setAttribute( 'data-bind', element._bindings );
		}
	}
	
}