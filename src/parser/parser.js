import { makeFragment, makeDiv } from './fragmentUtil'; 

const textMustache = /({{[^#\/].+?}})/g;
const anyMustache = /({{.+?}})/g;
const mustacheBrackets = /[{{|}}]/g;

const textElName = 'text-slot';
const bindingName = 'binding';

export default function parser( template ){
	
	const bindings = {};
	var i = 1;
	
	template = template.replace( textMustache, match =>  {
		const name = `t${i++}`;
		const ref = match.replace( mustacheBrackets, '' ).trim();
		bindings[ name ] = { ref };
		return `<${textElName} ${bindingName}="${name}"></${textElName}>`;
	});
	
	// sections
	
	const div = makeDiv( template );

	indexTextBindings( div, bindings );
	
	return { html: div.innerHTML, bindings };
}

function getPosition( el ) {
	var i = 0, prev = el;
	while( prev = prev.previousSibling ) i++;
	return i;
}

const bindingAttr = 'data-bind';

function indexTextBindings( element, bindings ) {
	
	
	const textElements = element.querySelectorAll( textElName );
	
	for( var i = 0, l = textElements.length, el, parent, attr, name, pos; i < l; i++ ) {
		el = textElements[i];
		name = el.getAttribute( bindingName );
		
		parent = el.parentNode;
		
		// add the binding name to the parent element
		attr = parent.getAttribute( bindingAttr ) || '';
		if ( attr ) attr += ',';
		attr += name;
		parent.setAttribute( bindingAttr, attr );
		
		// add the childNode position to the binding
		pos = getPosition( el );
		if ( pos ) bindings[ name ].index = pos;
	}
	
	// remove the elements from the dom
	for( var i = 0, l = textElements.length, el; i < l; i++ ) {
		el = textElements[i];
		el.parentNode.removeChild( el );
	}
}